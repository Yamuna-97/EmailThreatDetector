from pydantic import BaseModel
from typing import Dict, List, Any

class AnalyticsSummary(BaseModel):
    total_users: int
    total_emails_scanned: int
    total_threats: int
    critical_threats: int
    high_risk_threats: int
    phishing_count: int
    bec_count: int
    fraud_count: int
    suspicious_ip_count: int
    threat_trend: List[Dict[str, Any]]
    threat_distribution: List[Dict[str, Any]]
    severity_distribution: List[Dict[str, Any]]
    geographic_distribution: List[Dict[str, Any]]
