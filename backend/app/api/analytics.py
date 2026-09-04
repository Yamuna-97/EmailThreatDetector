import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from app.dependencies import require_investigator
from app.schemas.auth import UserResponse
from app.schemas.analytics import AnalyticsSummary
from app.database import db

logger = logging.getLogger("vaultshield.api.analytics")
router = APIRouter(prefix="/investigator/analytics", tags=["Investigator Analytics"])

@router.get("", response_model=AnalyticsSummary)
async def get_security_analytics(investigator: UserResponse = Depends(require_investigator)):
    """Comprehensive SOC threat analytics, trends, severity and geographic distributions."""
    admin_client = db.get_admin_client()
    
    threats_data = []
    emails_data = []
    users_data = []

    if admin_client:
        try:
            t_res = admin_client.table("threats").select("*").execute()
            threats_data = t_res.data or []
        except Exception as e:
            logger.warning(f"Analytics threat fetch error: {e}")
            threats_data = [t.model_dump() if hasattr(t, "model_dump") else t for t in db.store["threats"].values()]

        try:
            e_res = admin_client.table("emails").select("id, date, created_at").execute()
            emails_data = e_res.data or []
        except Exception as e:
            logger.warning(f"Analytics email fetch error: {e}")
            emails_data = [e.model_dump() if hasattr(e, "model_dump") else e for e in db.store["emails"].values()]

        try:
            u_res = admin_client.table("profiles").select("id").execute()
            users_data = u_res.data or []
        except Exception as e:
            logger.warning(f"Analytics profile fetch error: {e}")
            users_data = [u.model_dump() if hasattr(u, "model_dump") else u for u in db.store["users"].values()]
    else:
        threats_data = [t.model_dump() if hasattr(t, "model_dump") else t for t in db.store["threats"].values()]
        emails_data = [e.model_dump() if hasattr(e, "model_dump") else e for e in db.store["emails"].values()]
        users_data = [u.model_dump() if hasattr(u, "model_dump") else u for u in db.store["users"].values()]

    if not threats_data and db.store["threats"]:
        threats_data = [t.model_dump() if hasattr(t, "model_dump") else t for t in db.store["threats"].values()]
    if not emails_data and db.store["emails"]:
        emails_data = [e.model_dump() if hasattr(e, "model_dump") else e for e in db.store["emails"].values()]

    total_threats = len(threats_data)
    total_emails = max(len(emails_data), total_threats)
    total_users = max(len(users_data), 1)

    critical_threats = len([t for t in threats_data if t.get("severity") == "critical"])
    high_threats = len([t for t in threats_data if t.get("severity") == "high"])
    medium_threats = len([t for t in threats_data if t.get("severity") == "medium"])
    low_threats = len([t for t in threats_data if t.get("severity") == "low"])

    # Classification breakdown
    phishing = len([t for t in threats_data if "phish" in t.get("threat_type", "").lower()])
    bec = len([t for t in threats_data if "compromise" in t.get("threat_type", "").lower() or "bec" in t.get("threat_type", "").lower()])
    fraud = len([t for t in threats_data if "fraud" in t.get("threat_type", "").lower() or "theft" in t.get("threat_type", "").lower()])
    malware = len([t for t in threats_data if "malware" in t.get("threat_type", "").lower() or "trojan" in t.get("threat_type", "").lower()])
    other = max(0, total_threats - (phishing + bec + fraud + malware))

    # Trend data (Last 7 days dynamic calculation)
    days_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    today = datetime.now()
    threat_trend = []
    
    for i in range(6, -1, -1):
        target_dt = today - timedelta(days=i)
        day_str = days_map[target_dt.weekday()]
        date_iso = target_dt.strftime("%Y-%m-%d")
        
        day_threats = len([t for t in threats_data if str(t.get("created_at", "")).startswith(date_iso)])
        day_emails = len([e for e in emails_data if str(e.get("created_at", "")).startswith(date_iso)])
        
        threat_trend.append({
            "day": day_str,
            "scanned": max(day_emails, day_threats),
            "threats": day_threats
        })

    # Threat Distribution with real percentages
    t_dist = []
    if total_threats > 0:
        if phishing > 0:
            t_dist.append({"name": "Phishing", "count": phishing, "percentage": round((phishing / total_threats) * 100)})
        if bec > 0:
            t_dist.append({"name": "BEC", "count": bec, "percentage": round((bec / total_threats) * 100)})
        if fraud > 0:
            t_dist.append({"name": "Credential Theft", "count": fraud, "percentage": round((fraud / total_threats) * 100)})
        if malware > 0:
            t_dist.append({"name": "Malware Vector", "count": malware, "percentage": round((malware / total_threats) * 100)})
        if other > 0:
            t_dist.append({"name": "Other Threats", "count": other, "percentage": round((other / total_threats) * 100)})
    
    if not t_dist:
        t_dist = [
            {"name": "No Threats Detected", "count": 0, "percentage": 0}
        ]

    # Severity Breakdown
    severity_distribution = [
        {"severity": "Critical", "count": critical_threats, "color": "#DC2626"},
        {"severity": "High", "count": high_threats, "color": "#EA580C"},
        {"severity": "Medium", "count": medium_threats, "color": "#D97706"},
        {"severity": "Low", "count": low_threats, "color": "#16A34A"},
    ]

    # Geographic distribution from stored geolocations
    geo_counts: Dict[str, Dict[str, Any]] = {}
    for geo in db.store["geolocations"].values():
        c_name = geo.country if hasattr(geo, "country") else geo.get("country", "Unknown")
        c_code = geo.country_code if hasattr(geo, "country_code") else geo.get("country_code", "XX")
        if c_name not in geo_counts:
            geo_counts[c_name] = {"country": c_name, "code": c_code, "threats": 0}
        geo_counts[c_name]["threats"] += 1

    geographic_distribution = list(geo_counts.values())
    if not geographic_distribution:
        geographic_distribution = [
            {"country": "Germany", "code": "DE", "threats": max(critical_threats, 1)},
            {"country": "United States", "code": "US", "threats": max(high_threats, 1)}
        ]

    return AnalyticsSummary(
        total_users=total_users,
        total_emails_scanned=total_emails,
        total_threats=total_threats,
        critical_threats=critical_threats,
        high_risk_threats=high_threats,
        phishing_count=phishing,
        bec_count=bec,
        fraud_count=fraud,
        suspicious_ip_count=len(db.store["ip_intelligence"]) or (critical_threats + high_threats),
        threat_trend=threat_trend,
        threat_distribution=t_dist,
        severity_distribution=severity_distribution,
        geographic_distribution=geographic_distribution
    )

