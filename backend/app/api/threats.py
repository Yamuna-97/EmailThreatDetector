import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import get_current_user
from app.schemas.auth import UserResponse, MessageResponse
from app.schemas.threat import ThreatModel, AlertModel
from app.database import db

logger = logging.getLogger("vaultshield.api.threats")
router = APIRouter(prefix="/threats", tags=["Threats & Alerts"])

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

    return sorted(threats, key=lambda x: x.created_at, reverse=True)

@router.get("/{threat_id}", response_model=ThreatModel)
async def get_threat(
    threat_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Retrieve single threat incident."""
    threat = db.store["threats"].get(threat_id)
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
    return MessageResponse(message="Alert marked as read")

@router.get("/user/history", response_model=List[ThreatModel])
async def get_user_history(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve personal threat and scan history."""
    return [t for t in db.store["threats"].values() if t.user_id == current_user.id]
