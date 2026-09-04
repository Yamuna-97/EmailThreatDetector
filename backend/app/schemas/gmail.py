from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class GmailConnectResponse(BaseModel):
    auth_url: str

class GmailStatusResponse(BaseModel):
    is_connected: bool
    email_address: Optional[str] = None
    auto_scan_enabled: bool = False
    scan_limit: int = 10
    last_synced_at: Optional[datetime] = None

class GmailScanRequest(BaseModel):
    limit: int = 10

class GmailAutoScanToggleRequest(BaseModel):
    enabled: bool
