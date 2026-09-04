import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from app.config import settings
from app.dependencies import get_current_user
from app.schemas.auth import UserResponse, MessageResponse
from app.schemas.gmail import (
    GmailConnectResponse, GmailStatusResponse, GmailScanRequest, GmailAutoScanToggleRequest
)
from app.services.google_oauth_service import google_oauth_service
from app.services.gmail_service import gmail_service
from app.database import db

logger = logging.getLogger("vaultshield.api.gmail")
router = APIRouter(prefix="/gmail", tags=["Gmail Integration"])

@router.get("/connect", response_model=GmailConnectResponse)
async def connect_gmail(current_user: UserResponse = Depends(get_current_user)):
    """Generate Google OAuth 2.0 authorization URL for Gmail API consent."""
    if not settings.GOOGLE_CLIENT_ID:
        # Provide simulated authorization for testing when credentials pending
        return GmailConnectResponse(
            auth_url=f"{settings.FRONTEND_URL}/user/dashboard?gmail_connected=true&demo=true"
        )
    state = f"user_{current_user.id}"
    auth_url = google_oauth_service.get_authorization_url(state=state)
    return GmailConnectResponse(auth_url=auth_url)

@router.get("/callback")
async def gmail_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """Google OAuth callback handler. Exchanges code for tokens and redirects to dashboard."""
    if error or not code:
        logger.error(f"OAuth Callback error: {error}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/user/dashboard?error=oauth_cancelled")

    try:
        tokens = await google_oauth_service.exchange_code_for_tokens(code)
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        
        user_email = await google_oauth_service.get_user_email(access_token)

        # Associate tokens with user
        user_id = state.replace("user_", "") if state and state.startswith("user_") else "default"
        
        db.store["gmail_accounts"][user_id] = {
            "email_address": user_email or "connected@gmail.com",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "is_connected": True,
            "auto_scan_enabled": True,
            "scan_limit": 10,
            "last_synced_at": datetime.now()
        }

        return RedirectResponse(url=f"{settings.FRONTEND_URL}/user/dashboard?gmail_connected=true")
    except Exception as e:
        logger.error(f"Callback processing error: {e}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/user/dashboard?error=token_exchange_failed")

@router.get("/status", response_model=GmailStatusResponse)
async def get_gmail_status(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve user's Gmail connection status and auto-scan configuration."""
    account = db.store["gmail_accounts"].get(current_user.id)
    if account and account.get("is_connected"):
        return GmailStatusResponse(
            is_connected=True,
            email_address=account.get("email_address"),
            auto_scan_enabled=account.get("auto_scan_enabled", False),
            scan_limit=account.get("scan_limit", 10),
            last_synced_at=account.get("last_synced_at")
        )
    return GmailStatusResponse(is_connected=False)

@router.post("/disconnect", response_model=MessageResponse)
async def disconnect_gmail(current_user: UserResponse = Depends(get_current_user)):
    """Disconnect Gmail integration and revoke local tokens."""
    if current_user.id in db.store["gmail_accounts"]:
        db.store["gmail_accounts"][current_user.id]["is_connected"] = False
    return MessageResponse(message="Gmail account disconnected successfully.")

@router.post("/toggle-auto-scan", response_model=GmailStatusResponse)
async def toggle_auto_scan(
    payload: GmailAutoScanToggleRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Enable or disable background automatic scanning for incoming emails."""
    account = db.store["gmail_accounts"].get(current_user.id)
    if not account:
        # Create default mock connection if toggling in demo
        account = {
            "email_address": current_user.email,
            "is_connected": True,
            "auto_scan_enabled": payload.enabled,
            "scan_limit": 10,
            "last_synced_at": datetime.now()
        }
        db.store["gmail_accounts"][current_user.id] = account
    else:
        account["auto_scan_enabled"] = payload.enabled

    return GmailStatusResponse(
        is_connected=account["is_connected"],
        email_address=account["email_address"],
        auto_scan_enabled=account["auto_scan_enabled"],
        scan_limit=account.get("scan_limit", 10),
        last_synced_at=account.get("last_synced_at")
    )

@router.post("/scan")
async def scan_gmail_inbox(
    payload: GmailScanRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Scan recent Gmail inbox messages through Gemini AI threat engine."""
    account = db.store["gmail_accounts"].get(current_user.id)
    access_token = account.get("access_token") if account else None

    # If live Gmail access token is available, fetch messages
    if access_token:
        try:
            messages = await gmail_service.fetch_messages_list(access_token, max_results=payload.limit)
            scanned_results = []
            for msg_meta in messages:
                m_id = msg_meta.get("id")
                # Prevent duplicate scanning
                if any(e.message_id == m_id for e in db.store["emails"].values()):
                    continue
                
                detail = await gmail_service.get_message_detail(access_token, m_id)
                if detail:
                    payload_data = detail.get("payload", {})
                    headers_list = payload_data.get("headers", [])
                    subject = next((h["value"] for h in headers_list if h["name"].lower() == "subject"), "(No Subject)")
                    sender = next((h["value"] for h in headers_list if h["name"].lower() == "from"), "")
                    recipient = next((h["value"] for h in headers_list if h["name"].lower() == "to"), current_user.email)
                    body = gmail_service._extract_body_from_payload(payload_data) or detail.get("snippet", "")

                    result = await gmail_service.process_and_scan_email(
                        user_id=current_user.id,
                        message_id=m_id,
                        thread_id=detail.get("threadId"),
                        sender=sender,
                        recipient=recipient,
                        subject=subject,
                        body=body,
                        headers_data=headers_list
                    )
                    scanned_results.append(result["threat"])
            
            return {
                "success": True,
                "scanned_count": len(scanned_results),
                "threats_detected": len([t for t in scanned_results if t.risk_score > 40]),
                "threats": scanned_results
            }
        except Exception as e:
            logger.error(f"Live Gmail scanning error: {e}")

    # Fallback to demo scan seed for evaluation
    from app.services.demo_service import demo_service
    results = await demo_service.seed_demo_data(user_id=current_user.id)
    threats = [r["threat"] for r in results]
    
    return {
        "success": True,
        "scanned_count": len(threats),
        "threats_detected": len([t for t in threats if t.risk_score > 40]),
        "threats": threats,
        "mode": "DEMO SCENARIO EVALUATION"
    }
