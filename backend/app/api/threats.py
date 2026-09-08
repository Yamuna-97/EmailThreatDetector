import logging
from typing import List, Optional, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import get_current_user
from app.schemas.auth import UserResponse, MessageResponse
from app.schemas.threat import ThreatModel, AlertModel
from app.database import db

logger = logging.getLogger("vaultshield.api.threats")
router = APIRouter(prefix="/threats", tags=["Threats & Alerts"])


def _safe_sort_key(obj: Any) -> float:
    """
    Extract a normalized UNIX float timestamp from datetime or ISO string for sorting.
    Prevents TypeError: can't compare offset-naive and offset-aware datetimes.
    """
    val = getattr(obj, "created_at", None) if hasattr(obj, "created_at") else (obj.get("created_at") if isinstance(obj, dict) else obj)
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc).timestamp()
        return val.timestamp()
    if isinstance(val, str):
        try:
            dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.timestamp()
        except Exception:
            return 0.0
    return 0.0


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

    # If nothing found in memory, fall back to Supabase
    if not threats:
        db_threats = _load_threats_from_supabase(current_user.id, is_investigator)
        for t in db_threats:
            if severity and t.severity.lower() != severity.lower():
                continue
            if status_filter and t.status.lower() != status_filter.lower():
                continue
            threats.append(t)

    return sorted(threats, key=_safe_sort_key, reverse=True)


@router.get("/{threat_id}", response_model=ThreatModel)
async def get_threat(
    threat_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Retrieve single threat incident."""
    threat = db.store["threats"].get(threat_id)

    # Try Supabase if not in memory
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


from app.services.alert_service import alert_service


@router.get("/user/alerts", response_model=List[AlertModel])
async def get_user_alerts(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve real-time persistent security alerts for current user from Supabase."""
    is_investigator = current_user.role in ["investigator", "admin"]
    return alert_service.get_alerts(current_user.id, is_investigator)


@router.post("/alerts/{alert_id}/read", response_model=MessageResponse)
async def mark_alert_read(
    alert_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Mark an alert as read in Supabase."""
    success = alert_service.mark_read(alert_id, current_user.id)
    return MessageResponse(message="Alert marked as read", success=success)


@router.delete("/alerts/{alert_id}", response_model=MessageResponse)
async def delete_alert(
    alert_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete an alert from Supabase."""
    success = alert_service.delete_alert(alert_id, current_user.id)
    return MessageResponse(message="Alert deleted successfully", success=success)


@router.delete("/alerts", response_model=MessageResponse)
@router.post("/alerts/clear", response_model=MessageResponse)
async def clear_user_alerts(current_user: UserResponse = Depends(get_current_user)):
    """Clear all alerts for the current user from Supabase."""
    success = alert_service.clear_all(current_user.id)
    return MessageResponse(message="All alerts cleared successfully", success=success)


@router.get("/user/history", response_model=List[ThreatModel])
async def get_user_history(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve personal threat and scan history."""
    threats = [t for t in db.store["threats"].values() if t.user_id == current_user.id]

    # Fall back to Supabase if empty
    if not threats:
        threats = _load_threats_from_supabase(current_user.id, is_investigator=False)

    return sorted(threats, key=_safe_sort_key, reverse=True)
