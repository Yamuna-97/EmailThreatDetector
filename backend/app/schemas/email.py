from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class EmailUrlInfo(BaseModel):
    url: str
    domain: Optional[str] = None
    protocol: Optional[str] = None
    hostname: Optional[str] = None
    path: Optional[str] = None
    is_ip_based: bool = False
    is_shortener: bool = False
    is_punycode: bool = False
    risk_flags: List[str] = []

class EmailAttachmentInfo(BaseModel):
    filename: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    is_suspicious: bool = False
    risk_reason: Optional[str] = None

class EmailHeaderInfo(BaseModel):
    from_header: Optional[str] = None
    to_header: Optional[str] = None
    reply_to: Optional[str] = None
    return_path: Optional[str] = None
    received_headers: List[str] = []
    auth_results: Optional[str] = None
    spf: Optional[str] = "unknown"
    dkim: Optional[str] = "unknown"
    dmarc: Optional[str] = "unknown"
    source_ip: Optional[str] = None

class EmailModel(BaseModel):
    id: str
    user_id: str
    message_id: str
    thread_id: Optional[str] = None
    sender: str
    recipient: str
    cc: Optional[str] = None
    bcc: Optional[str] = None
    subject: str
    date: datetime
    snippet: Optional[str] = None
    plain_text_body: Optional[str] = None
    html_body: Optional[str] = None
    labels: List[str] = []
    headers: Optional[EmailHeaderInfo] = None
    urls: List[EmailUrlInfo] = []
    attachments: List[EmailAttachmentInfo] = []
    is_demo: bool = False
    created_at: datetime = datetime.now()

class ManualScanRequest(BaseModel):
    sender: str
    recipient: Optional[str] = "user@enterprise.com"
    subject: str
    body: str
    raw_headers: Optional[str] = None
