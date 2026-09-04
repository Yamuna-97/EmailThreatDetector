import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.email import EmailModel, ManualScanRequest
from app.services.gmail_service import gmail_service
from app.database import db

logger = logging.getLogger("vaultshield.api.emails")
router = APIRouter(prefix="/emails", tags=["Emails"])


def _load_emails_from_supabase(user_id: str, is_investigator: bool) -> List[EmailModel]:
    """
    Restore email records from Supabase when db.store is empty after restart.
    Returns a list of EmailModel objects built from raw Supabase rows.
    """
    admin_client = db.get_admin_client()
    if not admin_client:
        return []
    try:
        query = admin_client.table("emails").select("*").order("date", desc=True).limit(200)
        if not is_investigator:
            query = query.eq("user_id", user_id)
        res = query.execute()
        emails = []
        for row in (res.data or []):
            try:
                e = EmailModel(
                    id=row["id"],
                    user_id=row["user_id"],
                    message_id=row.get("message_id", ""),
                    thread_id=row.get("thread_id"),
                    sender=row.get("sender", ""),
                    recipient=row.get("recipient", ""),
                    subject=row.get("subject", ""),
                    date=row.get("date") or row.get("created_at") or datetime.now().isoformat(),
                    snippet=row.get("snippet", ""),
                    plain_text_body=row.get("plain_text_body", ""),
                    is_demo=row.get("is_demo", False),
                )
                emails.append(e)
                # Backfill into in-memory store
                db.store["emails"][e.id] = e
            except Exception as parse_err:
                logger.debug(f"Skipping malformed email row: {parse_err}")
        logger.info(f"Restored {len(emails)} email(s) from Supabase for user {user_id}.")
        return emails
    except Exception as e:
        logger.warning(f"Could not restore emails from Supabase: {e}")
        return []


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

    # ✅ FIX: If no results in memory (e.g. after restart), restore from Supabase
    if not emails:
        db_emails = _load_emails_from_supabase(current_user.id, is_investigator)
        for email in db_emails:
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

    # ✅ FIX: Try Supabase if not in memory
    if not email:
        admin_client = db.get_admin_client()
        if admin_client:
            try:
                res = admin_client.table("emails").select("*").eq("id", email_id).execute()
                if res.data:
                    row = res.data[0]
                    email = EmailModel(
                        id=row["id"],
                        user_id=row["user_id"],
                        message_id=row.get("message_id", ""),
                        thread_id=row.get("thread_id"),
                        sender=row.get("sender", ""),
                        recipient=row.get("recipient", ""),
                        subject=row.get("subject", ""),
                        date=row.get("date") or row.get("created_at") or datetime.now().isoformat(),
                        snippet=row.get("snippet", ""),
                        plain_text_body=row.get("plain_text_body", ""),
                        is_demo=row.get("is_demo", False),
                    )
                    db.store["emails"][email.id] = email
            except Exception as e:
                logger.warning(f"Could not fetch email {email_id} from Supabase: {e}")

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
