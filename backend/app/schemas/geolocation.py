from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class IPIntelligenceModel(BaseModel):
    ip: str
    is_private: bool = False
    fraud_score: int = 0
    is_vpn: bool = False
    is_proxy: bool = False
    is_tor: bool = False
    is_bot: bool = False
    isp: Optional[str] = None
    asn: Optional[str] = None
    organization: Optional[str] = None
    country_code: Optional[str] = None
    country_name: Optional[str] = None
    city: Optional[str] = None
    cached_at: datetime = datetime.now()

class GeoLocationModel(BaseModel):
    ip: str
    country: Optional[str] = "Unknown"
    country_code: Optional[str] = "XX"
    region: Optional[str] = None
    city: Optional[str] = "Unknown"
    latitude: float = 0.0
    longitude: float = 0.0
    timezone: Optional[str] = None
    isp: Optional[str] = None
    asn: Optional[str] = None
    cached_at: datetime = datetime.now()
