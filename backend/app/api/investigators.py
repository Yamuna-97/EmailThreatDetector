import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import require_investigator, get_current_user
from app.schemas.auth import UserResponse, MessageResponse
from app.schemas.threat import ThreatModel
from app.schemas.investigator import (
    ForensicInvestigationDetails, UpdateInvestigationStatusRequest, InvestigationEvent
)
from app.database import db

logger = logging.getLogger("vaultshield.api.investigators")
router = APIRouter(prefix="/investigator", tags=["Investigator Console"])

@router.get("/dashboard")
async def get_investigator_dashboard(investigator: UserResponse = Depends(require_investigator)):
    """Summary dashboard metrics for cybersecurity investigators."""
    all_threats = list(db.store["threats"].values())
    all_emails = list(db.store["emails"].values())
    all_users = list(db.store["users"].values())

    critical_count = len([t for t in all_threats if t.severity == "critical"])
    high_count = len([t for t in all_threats if t.severity == "high"])
    phishing_count = len([t for t in all_threats if "phish" in t.threat_type.lower()])
    bec_count = len([t for t in all_threats if "compromise" in t.threat_type.lower() or "bec" in t.threat_type.lower()])
    fraud_count = len([t for t in all_threats if "fraud" in t.threat_type.lower() or "theft" in t.threat_type.lower()])
    suspicious_ips = len(db.store["ip_intelligence"])

    return {
        "total_users": max(len(all_users), 1),
        "total_emails_scanned": len(all_emails),
        "total_threats": len(all_threats),
        "critical_threats": critical_count,
        "high_risk_threats": high_count,
        "phishing_count": phishing_count,
        "bec_count": bec_count,
        "fraud_count": fraud_count,
        "suspicious_ip_count": suspicious_ips,
        "recent_incidents": sorted(all_threats, key=lambda x: x.created_at, reverse=True)[:6]
    }

@router.get("/threats", response_model=List[ThreatModel])
async def list_all_investigator_threats(
    severity: Optional[str] = None,
    threat_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    investigator: UserResponse = Depends(require_investigator)
):
    """Retrieve all organizational threat incidents with filtering."""
    threats = list(db.store["threats"].values())
    filtered = []
    for t in threats:
        if severity and t.severity.lower() != severity.lower():
            continue
        if threat_type and threat_type.lower() not in t.threat_type.lower():
            continue
        if status_filter and t.status.lower() != status_filter.lower():
            continue
        filtered.append(t)
    return sorted(filtered, key=lambda x: x.created_at, reverse=True)

@router.get("/forensics/{threat_id}", response_model=ForensicInvestigationDetails)
async def get_forensic_details(
    threat_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Complete Deep-Dive Forensic Dossier for Security Incident.
    Users can inspect their own threats; Investigators can inspect all.
    """
    threat = db.store["threats"].get(threat_id)
    if not threat:
        # Check Supabase if not in memory
        admin_client = db.get_admin_client()
        if admin_client:
            res = admin_client.table("threats").select("*").eq("id", threat_id).execute()
            if res.data:
                t_data = res.data[0]
                # Check permission
                if current_user.role not in ["investigator", "admin"] and t_data.get("user_id") != current_user.id:
                    raise HTTPException(status_code=403, detail="Forbidden: You can only view your own threat forensics")
        raise HTTPException(status_code=404, detail="Threat incident not found")

    if current_user.role not in ["investigator", "admin"] and threat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only view your own threat forensics")

    email = db.store["emails"].get(threat.email_id) if threat.email_id else None
    analysis = threat.analysis

    # Retrieve IP intelligence & Geo
    source_ip = "198.51.100.25"
    if email and email.headers and email.headers.source_ip:
        source_ip = email.headers.source_ip

    ip_intel = db.store["ip_intelligence"].get(source_ip)
    geo = db.store["geolocations"].get(source_ip)

    # Collate timeline events
    events = []
    for ev in db.store["investigation_events"].values():
        if ev.get("threat_id") == threat_id:
            events.append(InvestigationEvent(
                id=ev["id"],
                threat_id=threat_id,
                event_type=ev["event_type"],
                title=ev["title"],
                description=ev["description"],
                metadata=ev.get("metadata", {}),
                timestamp=ev.get("timestamp")
            ))

    return ForensicInvestigationDetails(
        threat=threat,
        email=email,
        analysis=analysis,
        ip_intelligence=ip_intel,
        geolocation=geo,
        timeline=events
    )

@router.post("/investigations/{threat_id}/status", response_model=MessageResponse)
async def update_investigation_status(
    threat_id: str,
    payload: UpdateInvestigationStatusRequest,
    investigator: UserResponse = Depends(require_investigator)
):
    """Update incident status (new, reviewing, confirmed, false_positive, resolved) + forensic notes."""
    threat = db.store["threats"].get(threat_id)
    if not threat:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    threat.status = payload.status
    
    # Log timeline event
    import uuid
    from datetime import datetime
    ev_id = str(uuid.uuid4())
    db.store["investigation_events"][ev_id] = {
        "id": ev_id,
        "threat_id": threat_id,
        "event_type": "status_changed",
        "title": f"Status updated to {payload.status.upper()}",
        "description": payload.notes or f"Updated by investigator {investigator.name}",
        "metadata": {"updated_by": investigator.email, "status": payload.status},
        "timestamp": datetime.now().isoformat()
    }

    return MessageResponse(message=f"Incident status successfully updated to {payload.status}.")

@router.get("/users")
async def list_users_for_investigator(investigator: UserResponse = Depends(require_investigator)):
    """List monitored user accounts and their associated risk profiles."""
    users_list = []
    for u in db.store["users"].values():
        user_threats = [t for t in db.store["threats"].values() if t.user_id == u.id]
        critical_count = len([t for t in user_threats if t.severity == "critical"])
        users_list.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "threats_count": len(user_threats),
            "critical_count": critical_count,
            "created_at": u.created_at
        })
    return users_list
