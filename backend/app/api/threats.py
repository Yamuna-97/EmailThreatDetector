import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import get_current_user
from app.schemas.auth import UserResponse, MessageResponse
from app.schemas.threat import ThreatModel, AlertModel
from app.database import db

logger = logging.getLogger("vaultshield.api.threats")
router = APIRouter(prefix="/threats", tags=["Threats & Alerts"])


def _load_threats_from_supabase(user_id: str, is_investigator: bool) -> List[ThreatModel]:
    """
    Restore threat records from Supabase when db.store is empty after restart.
    Returns a list of ThreatModel objects built from raw Supabase rows.
    """
    admin_client = db.get_admin_client()
    if not admin_client:
        return []
    try:
        query = admin_client.table("threats").select("*").order("created_at", desc=True)
        if not is_investigator:
            query = query.eq("user_id", user_id)
        res = query.execute()
        threats = []
        for row in (res.data or []):
            try:
                t = ThreatModel(
                    id=row["id"],
                    email_id=row.get("email_id"),
                    user_id=row["user_id"],
                    threat_type=row.get("threat_type", "Unknown"),
                    severity=row.get("severity", "low"),
                    risk_score=row.get("risk_score", 0),
                    confidence=float(row.get("confidence", 0.9)),
                    summary=row.get("summary", ""),
                    status=row.get("status", "new"),
                    is_demo=row.get("is_demo", False),
                    created_at=row.get("created_at"),
                )
                threats.append(t)
                # Backfill into in-memory store so subsequent requests are fast
                db.store["threats"][t.id] = t
            except Exception as parse_err:
                logger.debug(f"Skipping malformed threat row: {parse_err}")
        logger.info(f"Restored {len(threats)} threat(s) from Supabase for user {user_id}.")
        return threats
    except Exception as e:
        logger.warning(f"Could not restore threats from Supabase: {e}")
        return []


def _load_alerts_from_supabase(user_id: str, is_investigator: bool) -> List[AlertModel]:
    """
    Restore alert records from Supabase when db.store is empty after restart.
    """
    admin_client = db.get_admin_client()
    if not admin_client:
        return []
    try:
        query = admin_client.table("alerts").select("*").order("created_at", desc=True)
        if not is_investigator:
            query = query.eq("user_id", user_id)
        res = query.execute()
        alerts = []
        for row in (res.data or []):
            try:
                a = AlertModel(
                    id=row["id"],
                    user_id=row["user_id"],
                    threat_id=row.get("threat_id"),
                    title=row.get("title", ""),
                    message=row.get("message", ""),
                    severity=row.get("severity", "low"),
                    is_read=row.get("is_read", False),
                    created_at=row.get("created_at"),
                )
                alerts.append(a)
                db.store["alerts"][a.id] = a
            except Exception as parse_err:
                logger.debug(f"Skipping malformed alert row: {parse_err}")
        logger.info(f"Restored {len(alerts)} alert(s) from Supabase for user {user_id}.")
        return alerts
    except Exception as e:
        logger.warning(f"Could not restore alerts from Supabase: {e}")
        return []


@router.get("", response_model=List[ThreatModel])
async def list_threats(
    severity: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """List threat records (User sees own, Investigator sees all)."""
    is_investigator = current_user.role in ["investigator", "admin"]
    threats = []

    for t in db.store["threats"].values():
        if is_investigator or t.user_id == current_user.id:
            if severity and t.severity.lower() != severity.lower():
                continue
            if status_filter and t.status.lower() != status_filter.lower():
                continue
            threats.append(t)

    # ✅ FIX: If nothing found in memory, fall back to Supabase
    # (happens after backend restart when db.store was cleared)
    if not threats:
        db_threats = _load_threats_from_supabase(current_user.id, is_investigator)
        for t in db_threats:
            if severity and t.severity.lower() != severity.lower():
                continue
            if status_filter and t.status.lower() != status_filter.lower():
                continue
            threats.append(t)

    return sorted(threats, key=lambda x: x.created_at, reverse=True)


@router.get("/{threat_id}", response_model=ThreatModel)
async def get_threat(
    threat_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Retrieve single threat incident."""
    threat = db.store["threats"].get(threat_id)

    # ✅ FIX: Try Supabase if not in memory
    if not threat:
        admin_client = db.get_admin_client()
        if admin_client:
            try:
                res = admin_client.table("threats").select("*").eq("id", threat_id).execute()
                if res.data:
                    row = res.data[0]
                    threat = ThreatModel(
                        id=row["id"],
                        email_id=row.get("email_id"),
                        user_id=row["user_id"],
                        threat_type=row.get("threat_type", "Unknown"),
                        severity=row.get("severity", "low"),
                        risk_score=row.get("risk_score", 0),
                        confidence=float(row.get("confidence", 0.9)),
                        summary=row.get("summary", ""),
                        status=row.get("status", "new"),
                        is_demo=row.get("is_demo", False),
                        created_at=row.get("created_at"),
                    )
                    db.store["threats"][threat.id] = threat
            except Exception as e:
                logger.warning(f"Could not fetch threat {threat_id} from Supabase: {e}")

    if not threat:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    if current_user.role not in ["investigator", "admin"] and threat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only view your own threats")

    return threat


@router.get("/user/alerts", response_model=List[AlertModel])
async def get_user_alerts(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve real-time security alerts for current user."""
    is_investigator = current_user.role in ["investigator", "admin"]
    alerts = []
    for a in db.store["alerts"].values():
        if is_investigator or a.user_id == current_user.id:
            alerts.append(a)

    # ✅ FIX: Fall back to Supabase if store is empty
    if not alerts:
        alerts = _load_alerts_from_supabase(current_user.id, is_investigator)

    return sorted(alerts, key=lambda x: x.created_at, reverse=True)


@router.post("/alerts/{alert_id}/read", response_model=MessageResponse)
async def mark_alert_read(
    alert_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Mark an alert as read."""
    alert = db.store["alerts"].get(alert_id)
    if alert:
        alert.is_read = True

    # ✅ FIX: Also persist the read status to Supabase
    admin_client = db.get_admin_client()
    if admin_client:
        try:
            admin_client.table("alerts").update({"is_read": True}).eq("id", alert_id).execute()
        except Exception as e:
            logger.debug(f"Could not update alert read status in Supabase: {e}")

    return MessageResponse(message="Alert marked as read")


@router.get("/user/history", response_model=List[ThreatModel])
async def get_user_history(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve personal threat and scan history."""
    threats = [t for t in db.store["threats"].values() if t.user_id == current_user.id]

    # ✅ FIX: Fall back to Supabase if empty
    if not threats:
        threats = _load_threats_from_supabase(current_user.id, is_investigator=False)

    return sorted(threats, key=lambda x: x.created_at, reverse=True)
