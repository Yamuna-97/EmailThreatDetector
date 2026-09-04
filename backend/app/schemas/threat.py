from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

class ThreatIndicator(BaseModel):
    type: str  # e.g., 'social_engineering', 'suspicious_url', 'ip_reputation', 'auth_fail'
    description: str
    severity: Literal["low", "medium", "high", "critical"] = "medium"

class ThreatAnalysisModel(BaseModel):
    id: Optional[str] = None
    email_id: str
    user_id: str
    classification: str
    severity: Literal["low", "medium", "high", "critical"]
    ai_risk_score: int
    final_risk_score: int
    confidence: float
    summary: str
    indicators: List[ThreatIndicator] = []
    observed_evidence: Dict[str, Any] = {}
    ai_inferences: Dict[str, Any] = {}
    recommended_actions: List[str] = []
    created_at: datetime = datetime.now()

class ThreatModel(BaseModel):
    id: str
    email_id: Optional[str] = None
    user_id: str
    threat_type: str
    severity: Literal["low", "medium", "high", "critical"]
    risk_score: int
    confidence: float = 0.95
    summary: str
    status: Literal["new", "reviewing", "confirmed", "false_positive", "resolved"] = "new"
    is_demo: bool = False
    created_at: datetime = datetime.now()
    analysis: Optional[ThreatAnalysisModel] = None

class AlertModel(BaseModel):
    id: str
    user_id: str
    threat_id: Optional[str] = None
    title: str
    message: str
    severity: Literal["low", "medium", "high", "critical"]
    is_read: bool = False
    created_at: datetime = datetime.now()
