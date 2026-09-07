import logging
import uuid
from datetime import datetime, date, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import require_investigator, get_current_user
from app.schemas.auth import UserResponse, MessageResponse
from app.schemas.threat import ThreatModel, ThreatAnalysisModel
from app.schemas.email import EmailModel, EmailHeaderInfo
from app.schemas.geolocation import GeoLocationModel, IPIntelligenceModel
from app.schemas.investigator import (
    ForensicInvestigationDetails, UpdateInvestigationStatusRequest, InvestigationEvent
)
from app.database import db

logger = logging.getLogger("vaultshield.api.investigators")
router = APIRouter(prefix="/investigator", tags=["Investigator Console"])


def _safe_sort_key(obj: Any) -> float:
    """Extract float timestamp for safe datetime sorting."""
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

@router.get("/dashboard")
async def get_investigator_dashboard(investigator: UserResponse = Depends(require_investigator)):
    """Summary SOC dashboard metrics for cybersecurity investigators queried from Supabase."""
    admin_client = db.get_admin_client()
    
    threats_data = []
    emails_data = []
    users_data = []
    
    if admin_client:
        try:
            t_res = admin_client.table("threats").select("*").execute()
            threats_data = t_res.data or []
        except Exception as e:
            logger.warning(f"Error reading threats from Supabase: {e}")
            threats_data = [t.model_dump() if hasattr(t, "model_dump") else t for t in db.store["threats"].values()]

        try:
            e_res = admin_client.table("emails").select("*").execute()
            emails_data = e_res.data or []
        except Exception as e:
            logger.warning(f"Error reading emails from Supabase: {e}")
            emails_data = [e.model_dump() if hasattr(e, "model_dump") else e for e in db.store["emails"].values()]

        try:
            u_res = admin_client.table("profiles").select("id, email, name, role, created_at").execute()
            users_data = u_res.data or []
        except Exception as e:
            logger.warning(f"Error reading profiles from Supabase: {e}")
            users_data = [u.model_dump() if hasattr(u, "model_dump") else u for u in db.store["users"].values()]
    else:
        threats_data = [t.model_dump() if hasattr(t, "model_dump") else t for t in db.store["threats"].values()]
        emails_data = [e.model_dump() if hasattr(e, "model_dump") else e for e in db.store["emails"].values()]
        users_data = [u.model_dump() if hasattr(u, "model_dump") else u for u in db.store["users"].values()]

    # If both are empty, check in-memory store
    if not threats_data and db.store["threats"]:
        threats_data = [t.model_dump() if hasattr(t, "model_dump") else t for t in db.store["threats"].values()]
    if not emails_data and db.store["emails"]:
        emails_data = [e.model_dump() if hasattr(e, "model_dump") else e for e in db.store["emails"].values()]

    critical_count = len([t for t in threats_data if t.get("severity") == "critical"])
    high_count = len([t for t in threats_data if t.get("severity") == "high"])
    medium_count = len([t for t in threats_data if t.get("severity") == "medium"])
    low_count = len([t for t in threats_data if t.get("severity") == "low"])
    
    phishing_count = len([t for t in threats_data if "phish" in t.get("threat_type", "").lower()])
    bec_count = len([t for t in threats_data if "compromise" in t.get("threat_type", "").lower() or "bec" in t.get("threat_type", "").lower()])
    fraud_count = len([t for t in threats_data if "fraud" in t.get("threat_type", "").lower() or "theft" in t.get("threat_type", "").lower()])
    malware_count = len([t for t in threats_data if "malware" in t.get("threat_type", "").lower() or "trojan" in t.get("threat_type", "").lower()])
    other_count = len(threats_data) - (phishing_count + bec_count + fraud_count + malware_count)
    if other_count < 0:
        other_count = 0

    # Calculate threats detected today
    today_str = date.today().isoformat()
    def _is_today(c_at):
        if not c_at:
            return False
        if isinstance(c_at, (date, datetime)):
            return c_at.isoformat().startswith(today_str)
        return str(c_at).startswith(today_str)

    threats_today = len([t for t in threats_data if _is_today(t.get("created_at"))])

    # Active investigations
    active_investigations = len([t for t in threats_data if t.get("status") in ["new", "reviewing", "in_progress"]])

    # IP count
    suspicious_ips = len(db.store["ip_intelligence"]) or len([t for t in threats_data if t.get("severity") in ["critical", "high"]])

    # Sort recent incidents
    recent_threats = sorted(threats_data, key=_safe_sort_key, reverse=True)[:10]

    return {
        "total_users": max(len(users_data), 1),
        "total_emails_scanned": max(len(emails_data), len(threats_data)),
        "total_threats": len(threats_data),
        "critical_threats": critical_count,
        "high_threats": high_count,
        "high_risk_threats": high_count,
        "medium_threats": medium_count,
        "low_threats": low_count,
        "active_investigations": active_investigations,
        "threats_today": threats_today,
        "phishing_count": phishing_count,
        "bec_count": bec_count,
        "fraud_count": fraud_count,
        "malware_count": malware_count,
        "other_count": other_count,
        "suspicious_ip_count": suspicious_ips,
        "recent_incidents": recent_threats
    }

@router.get("/threats", response_model=List[ThreatModel])
async def list_all_investigator_threats(
    severity: Optional[str] = None,
    threat_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    investigator: UserResponse = Depends(require_investigator)
):
    """Retrieve all organizational threat incidents with filtering."""
    admin_client = db.get_admin_client()
    threats_list = []

    if admin_client:
        try:
            query = admin_client.table("threats").select("*")
            if severity:
                query = query.eq("severity", severity.lower())
            if status_filter:
                query = query.eq("status", status_filter.lower())
            res = query.order("created_at", desc=True).execute()
            if res.data:
                for row in res.data:
                    # Convert to ThreatModel format
                    threats_list.append(ThreatModel(
                        id=str(row.get("id")),
                        email_id=str(row.get("email_id")) if row.get("email_id") else None,
                        user_id=str(row.get("user_id")),
                        threat_type=row.get("threat_type", "Phishing"),
                        severity=row.get("severity", "medium"),
                        risk_score=int(row.get("risk_score", 50)),
                        confidence=float(row.get("confidence", 0.95)),
                        summary=row.get("summary", ""),
                        status=row.get("status", "new"),
                        is_demo=bool(row.get("is_demo", False)),
                        created_at=row.get("created_at") or datetime.now()
                    ))
        except Exception as e:
            logger.warning(f"Failed to query Supabase threats: {e}")

    # Combine with in-memory store if needed
    if not threats_list:
        mem_threats = list(db.store["threats"].values())
        for t in mem_threats:
            if severity and t.severity.lower() != severity.lower():
                continue
            if threat_type and threat_type.lower() not in t.threat_type.lower():
                continue
            if status_filter and t.status.lower() != status_filter.lower():
                continue
            threats_list.append(t)

    return sorted(threats_list, key=_safe_sort_key, reverse=True)

@router.get("/forensics/{threat_id}", response_model=ForensicInvestigationDetails)
async def get_forensic_details(
    threat_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Complete Deep-Dive Forensic Dossier for Security Incident.
    Users can inspect their own threats; Investigators can inspect all.
    """
    admin_client = db.get_admin_client()
    threat = db.store["threats"].get(threat_id)
    email = None
    analysis = None

    if not threat and admin_client:
        try:
            t_res = admin_client.table("threats").select("*").eq("id", threat_id).execute()
            if t_res.data:
                t_row = t_res.data[0]
                if current_user.role not in ["investigator", "admin"] and t_row.get("user_id") != current_user.id:
                    raise HTTPException(status_code=403, detail="Forbidden: You can only view your own threat forensics")
                
                threat = ThreatModel(
                    id=str(t_row.get("id")),
                    email_id=str(t_row.get("email_id")) if t_row.get("email_id") else None,
                    user_id=str(t_row.get("user_id")),
                    threat_type=t_row.get("threat_type", "Phishing"),
                    severity=t_row.get("severity", "medium"),
                    risk_score=int(t_row.get("risk_score", 50)),
                    confidence=float(t_row.get("confidence", 0.95)),
                    summary=t_row.get("summary", ""),
                    status=t_row.get("status", "new"),
                    is_demo=bool(t_row.get("is_demo", False)),
                    created_at=t_row.get("created_at") or datetime.now()
                )
        except Exception as e:
            logger.warning(f"Error fetching threat forensics from Supabase: {e}")

    if not threat:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    if current_user.role not in ["investigator", "admin"] and threat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only view your own threat forensics")

    # Retrieve associated email
    if threat.email_id:
        email = db.store["emails"].get(threat.email_id)
        if not email and admin_client:
            try:
                e_res = admin_client.table("emails").select("*").eq("id", threat.email_id).execute()
                if e_res.data:
                    e_row = e_res.data[0]
                    # Check headers
                    h_res = admin_client.table("email_headers").select("*").eq("email_id", threat.email_id).execute()
                    headers_model = None
                    if h_res.data:
                        h_row = h_res.data[0]
                        headers_model = EmailHeaderInfo(
                            from_header=h_row.get("from_header"),
                            to_header=h_row.get("to_header"),
                            reply_to=h_row.get("reply_to"),
                            return_path=h_row.get("return_path"),
                            spf=h_row.get("spf") or "unknown",
                            dkim=h_row.get("dkim") or "unknown",
                            dmarc=h_row.get("dmarc") or "unknown",
                            source_ip=h_row.get("source_ip")
                        )

                    email = EmailModel(
                        id=str(e_row.get("id")),
                        user_id=str(e_row.get("user_id")),
                        message_id=e_row.get("message_id", "N/A"),
                        thread_id=e_row.get("thread_id"),
                        sender=e_row.get("sender", "Unknown"),
                        recipient=e_row.get("recipient", "Unknown"),
                        subject=e_row.get("subject", "No Subject"),
                        plain_text_body=e_row.get("plain_text_body"),
                        headers=headers_model,
                        is_demo=bool(e_row.get("is_demo", False)),
                        created_at=e_row.get("created_at") or datetime.now()
                    )
            except Exception as e:
                logger.warning(f"Error fetching email from Supabase: {e}")

    # Analysis
    analysis = threat.analysis
    if not analysis and threat.email_id and admin_client:
        try:
            a_res = admin_client.table("threat_analyses").select("*").eq("email_id", threat.email_id).execute()
            if a_res.data:
                a_row = a_res.data[0]
                analysis = ThreatAnalysisModel(
                    id=str(a_row.get("id")),
                    email_id=str(a_row.get("email_id")),
                    user_id=str(a_row.get("user_id")),
                    classification=a_row.get("classification", "Phishing"),
                    severity=a_row.get("severity", "medium"),
                    ai_risk_score=int(a_row.get("ai_risk_score", 50)),
                    final_risk_score=int(a_row.get("final_risk_score", 50)),
                    confidence=float(a_row.get("confidence", 0.95)),
                    summary=a_row.get("summary", ""),
                    indicators=a_row.get("indicators", []),
                    observed_evidence=a_row.get("observed_evidence", {}),
                    ai_inferences=a_row.get("ai_inferences", {}),
                    recommended_actions=a_row.get("recommended_actions", []),
                    created_at=a_row.get("created_at") or datetime.now()
                )
        except Exception as e:
            logger.warning(f"Error fetching analysis from Supabase: {e}")

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
                timestamp=ev.get("timestamp") or datetime.now()
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
    admin_client = db.get_admin_client()
    threat = db.store["threats"].get(threat_id)
    
    if admin_client:
        try:
            admin_client.table("threats").update({
                "status": payload.status,
                "updated_at": datetime.now().isoformat()
            }).eq("id", threat_id).execute()
        except Exception as e:
            logger.warning(f"Error updating status in Supabase: {e}")

    if threat:
        threat.status = payload.status
    
    # Log timeline event
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
    admin_client = db.get_admin_client()
    users_list = []

    if admin_client:
        try:
            p_res = admin_client.table("profiles").select("*").execute()
            if p_res.data:
                for p in p_res.data:
                    u_id = str(p.get("id"))
                    # Count threats for this user
                    t_res = admin_client.table("threats").select("id, severity").eq("user_id", u_id).execute()
                    u_threats = t_res.data or []
                    critical_count = len([t for t in u_threats if t.get("severity") == "critical"])
                    users_list.append({
                        "id": u_id,
                        "email": p.get("email"),
                        "name": p.get("name"),
                        "role": p.get("role", "user"),
                        "threats_count": len(u_threats),
                        "critical_count": critical_count,
                        "created_at": p.get("created_at")
                    })
        except Exception as e:
            logger.warning(f"Failed to query Supabase profiles: {e}")

    if not users_list:
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

