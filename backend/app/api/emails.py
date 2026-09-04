import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.email import EmailModel, ManualScanRequest
from app.services.gmail_service import gmail_service
from app.database import db

logger = logging.getLogger("vaultshield.api.emails")
router = APIRouter(prefix="/emails", tags=["Emails"])

@router.get("", response_model=List[EmailModel])
async def list_emails(
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Retrieve emails for current user (or all emails if investigator)."""
    is_investigator = current_user.role in ["investigator", "admin"]
    emails = []
    
    for email in db.store["emails"].values():
        if is_investigator or email.user_id == current_user.id:
            if search:
                s_lower = search.lower()
                if (s_lower in email.subject.lower() or 
                    s_lower in email.sender.lower() or 
                    s_lower in (email.plain_text_body or "").lower()):
                    emails.append(email)
            else:
                emails.append(email)

    return sorted(emails, key=lambda x: x.date, reverse=True)

@router.get("/{email_id}", response_model=EmailModel)
async def get_email(
    email_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get single email detail by ID."""
    email = db.store["emails"].get(email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    if current_user.role not in ["investigator", "admin"] and email.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only view your own emails")

    return email

@router.post("/scan/manual")
async def manual_scan_email(
    payload: ManualScanRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Manually paste and analyze raw email text, sender, subject, and headers through
    the Gemini AI + IPQualityScore + Threat Engine pipeline.
    """
    import uuid
    headers_dict = {}
    if payload.raw_headers:
        for line in payload.raw_headers.strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                headers_dict[k.strip()] = v.strip()
    
    if "From" not in headers_dict:
        headers_dict["From"] = payload.sender
    if "To" not in headers_dict:
        headers_dict["To"] = payload.recipient

    result = await gmail_service.process_and_scan_email(
        user_id=current_user.id,
        message_id=f"manual_{uuid.uuid4().hex[:8]}",
        thread_id=None,
        sender=payload.sender,
        recipient=payload.recipient or current_user.email,
        subject=payload.subject,
        body=payload.body,
        headers_data=headers_dict,
        is_demo=False
    )

    return {
        "success": True,
        "threat": result["threat"],
        "email": result["email"],
        "analysis": result["analysis"],
        "ip_intelligence": result["ip_intelligence"],
        "geolocation": result["geolocation"]
    }
