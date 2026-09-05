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
    # Automatic monitoring fields
    monitoring_active: bool = False
    emails_auto_processed: int = 0
    warnings_sent: int = 0
    watch_expiry: Optional[datetime] = None
    last_event_time: Optional[datetime] = None


class GmailScanRequest(BaseModel):
    limit: int = 10
    include_spam: bool = True
    folder: Optional[str] = "all"  # "all", "inbox", "spam"


class GmailAutoScanToggleRequest(BaseModel):
    enabled: bool


class MonitoringStatusResponse(BaseModel):
    """Detailed monitoring status returned by /api/gmail/monitor/status."""
    monitoring_active: bool
    mode: str = "disabled"  # "disabled" | "pubsub" | "polling"
    email_address: Optional[str] = None
    watch_expiry: Optional[datetime] = None
    last_history_id: Optional[str] = None
    emails_auto_processed: int = 0
    threats_detected: int = 0
    warnings_sent: int = 0
    last_event_time: Optional[datetime] = None
    poll_interval_seconds: Optional[int] = None
    error: Optional[str] = None
