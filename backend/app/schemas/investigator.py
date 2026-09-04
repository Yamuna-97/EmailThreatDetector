from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from app.schemas.email import EmailModel
from app.schemas.threat import ThreatModel, ThreatAnalysisModel
from app.schemas.geolocation import GeoLocationModel, IPIntelligenceModel

class InvestigationEvent(BaseModel):
    id: str
    threat_id: str
    event_type: str
    title: str
    description: str
    metadata: Dict[str, Any] = {}
    timestamp: datetime = datetime.now()

class ForensicInvestigationDetails(BaseModel):
    threat: ThreatModel
    email: Optional[EmailModel] = None
    analysis: Optional[ThreatAnalysisModel] = None
    ip_intelligence: Optional[IPIntelligenceModel] = None
    geolocation: Optional[GeoLocationModel] = None
    timeline: List[InvestigationEvent] = []

class UpdateInvestigationStatusRequest(BaseModel):
    status: Literal["new", "reviewing", "confirmed", "false_positive", "resolved"]
    notes: Optional[str] = None
