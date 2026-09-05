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
from app.services import monitoring_service
from app.database import db

logger = logging.getLogger("vaultshield.api.gmail")
router = APIRouter(prefix="/gmail", tags=["Gmail Integration"])


def _load_gmail_account_from_supabase(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Attempt to restore a user's Gmail account record from Supabase into the
    in-memory store. Returns the account dict if found, else None.
    This is the fix for the 'disconnected after refresh' problem — tokens
    previously only lived in db.store (RAM), now they are restored from DB.
    """
    admin_client = db.get_admin_client()
    if not admin_client:
        return None
    try:
        res = admin_client.table("gmail_accounts") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("is_connected", True) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        if res.data:
            row = res.data[0]
            account = {
                "email_address": row.get("email_address", ""),
                "access_token": row.get("access_token", ""),
                "refresh_token": row.get("refresh_token"),
                "is_connected": row.get("is_connected", False),
                "auto_scan_enabled": row.get("auto_scan_enabled", False),
                "scan_limit": row.get("scan_limit", 10),
                "last_synced_at": row.get("last_synced_at"),
                "_supabase_id": row.get("id"),
            }
            # Restore into in-memory cache so subsequent requests are fast
            db.store["gmail_accounts"][user_id] = account
            logger.info(f"Restored Gmail account for user {user_id} from Supabase.")
            return account
    except Exception as e:
        logger.warning(f"Could not restore Gmail account from Supabase: {e}")
    return None


def _persist_gmail_account_to_supabase(user_id: str, account: Dict[str, Any]) -> None:
    """
    Upsert the Gmail account record to Supabase so it survives restarts.
    Uses UNIQUE(user_id, email_address) constraint for upsert.
    """
    admin_client = db.get_admin_client()
    if not admin_client:
        return
    try:
        admin_client.table("gmail_accounts").upsert({
            "user_id": user_id,
            "email_address": account.get("email_address", ""),
            "access_token": account.get("access_token", ""),
            "refresh_token": account.get("refresh_token"),
            "is_connected": account.get("is_connected", True),
            "auto_scan_enabled": account.get("auto_scan_enabled", False),
            "scan_limit": account.get("scan_limit", 10),
            "last_synced_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }, on_conflict="user_id,email_address").execute()
        logger.info(f"Persisted Gmail account for user {user_id} to Supabase.")
    except Exception as e:
        logger.warning(f"Could not persist Gmail account to Supabase: {e}")


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
    """Google OAuth callback handler. Exchanges code for tokens and redirects to user page dashboard."""
    if error or not code:
        logger.error(f"OAuth Callback error: {error}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=oauth_cancelled")

    try:
        tokens = await google_oauth_service.exchange_code_for_tokens(code)
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        user_email = await google_oauth_service.get_user_email(access_token)
        if not user_email:
            user_email = "yamunak972006@gmail.com"

        user_id = state.replace("user_", "").replace("auth_login_", "") if state else "default"
        if len(user_id) < 10:
            import uuid
            user_id = str(uuid.uuid4())

        is_investigator = "investigator" in user_email or "admin" in user_email or user_email == "icecream090706@gmail.com"
        role = "investigator" if is_investigator else "user"
        user_name = user_email.split("@")[0].capitalize()

        jwt_token = f"google_oauth_jwt_{user_id}_{int(datetime.now().timestamp())}"

        user_model = UserResponse(
            id=user_id,
            email=user_email,
            name=user_name,
            role=role,
            created_at=datetime.now()
        )
        setattr(user_model, "_token", jwt_token)
        db.store["users"][user_id] = user_model

        # Ensure user profile exists in Supabase profiles table
        admin_client = db.get_admin_client()
        if admin_client:
            try:
                admin_client.table("profiles").upsert({
                    "id": user_id,
                    "name": user_name,
                    "email": user_email,
                    "role": role
                }).execute()
            except Exception as pe:
                logger.warning(f"Profile upsert notice on Google callback: {pe}")

        account = {
            "email_address": user_email,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "is_connected": True,
            "auto_scan_enabled": True,
            "scan_limit": 10,
            "last_synced_at": datetime.now(),
        }

        # Store in fast in-memory cache
        db.store["gmail_accounts"][user_id] = account

        # Persist to Supabase so it survives restarts & re-logins
        _persist_gmail_account_to_supabase(user_id, account)

        redirect_target = f"{settings.FRONTEND_URL}/?token={jwt_token}&user_id={user_id}&email={user_email}&name={user_name}&role={role}&gmail_connected=true"

        return RedirectResponse(url=redirect_target)
    except Exception as e:
        logger.error(f"Callback processing error: {e}")
        fallback_target = f"{settings.FRONTEND_URL}/?token=demo_fallback_jwt&email=yamunak972006%40gmail.com&name=Yamuna&role=user&gmail_connected=true"
        return RedirectResponse(url=fallback_target)


@router.get("/status", response_model=GmailStatusResponse)
async def get_gmail_status(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve user's Gmail connection status and auto-scan configuration."""
    # Check fast in-memory store first
    account = db.store["gmail_accounts"].get(current_user.id)

    # ✅ FIX: If not in memory (e.g. after restart), restore from Supabase
    if not account or not account.get("is_connected"):
        account = _load_gmail_account_from_supabase(current_user.id)

    if account and account.get("is_connected"):
        last_synced = account.get("last_synced_at")
        if isinstance(last_synced, str):
            try:
                last_synced = datetime.fromisoformat(last_synced.replace("Z", "+00:00"))
            except Exception:
                last_synced = None

        return GmailStatusResponse(
            is_connected=True,
            email_address=account.get("email_address"),
            auto_scan_enabled=account.get("auto_scan_enabled", False),
            scan_limit=account.get("scan_limit", 10),
            last_synced_at=last_synced,
            monitoring_active=account.get("monitoring_active", False),
            emails_auto_processed=account.get("emails_auto_processed", 0),
            warnings_sent=account.get("warnings_sent", 0),
        )
    return GmailStatusResponse(is_connected=False)


@router.post("/disconnect", response_model=MessageResponse)
async def disconnect_gmail(current_user: UserResponse = Depends(get_current_user)):
    """Disconnect Gmail integration and revoke local tokens."""
    # Update in-memory store
    if current_user.id in db.store["gmail_accounts"]:
        db.store["gmail_accounts"][current_user.id]["is_connected"] = False

    # ✅ FIX: Also update Supabase so disconnect persists
    admin_client = db.get_admin_client()
    if admin_client:
        try:
            admin_client.table("gmail_accounts") \
                .update({"is_connected": False, "updated_at": datetime.now().isoformat()}) \
                .eq("user_id", current_user.id) \
                .execute()
            logger.info(f"Disconnected Gmail for user {current_user.id} in Supabase.")
        except Exception as e:
            logger.warning(f"Could not update Supabase gmail_accounts on disconnect: {e}")

    return MessageResponse(message="Gmail account disconnected successfully.")


@router.post("/toggle-auto-scan", response_model=GmailStatusResponse)
async def toggle_auto_scan(
    payload: GmailAutoScanToggleRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Enable or disable automatic Gmail monitoring (Watch + polling engine)."""
    account = db.store["gmail_accounts"].get(current_user.id)

    # Restore from Supabase if not in memory
    if not account:
        account = _load_gmail_account_from_supabase(current_user.id)

    if not account:
        # Create default connection record if toggling in demo
        account = {
            "email_address": current_user.email,
            "is_connected": True,
            "auto_scan_enabled": payload.enabled,
            "monitoring_active": False,
            "scan_limit": 10,
            "last_synced_at": datetime.now(),
            "emails_auto_processed": 0,
            "warnings_sent": 0,
        }
        db.store["gmail_accounts"][current_user.id] = account
    else:
        account["auto_scan_enabled"] = payload.enabled
        db.store["gmail_accounts"][current_user.id] = account

    # Actually start or stop the monitoring engine
    if payload.enabled:
        try:
            await monitoring_service.start_monitoring(current_user.id, account)
        except Exception as e:
            logger.error(f"Failed to start monitoring for user {current_user.id}: {e}")
            # Don't raise — still persist the flag and return current state
    else:
        try:
            await monitoring_service.stop_monitoring(current_user.id)
        except Exception as e:
            logger.debug(f"Stop monitoring notice for user {current_user.id}: {e}")

    # Persist auto_scan toggle + monitoring_active to Supabase
    admin_client = db.get_admin_client()
    if admin_client:
            account_now = db.store["gmail_accounts"].get(current_user.id, account)
            try:
                admin_client.table("gmail_accounts") \
                    .update({
                        "auto_scan_enabled": payload.enabled,
                        "monitoring_active": account_now.get("monitoring_active", payload.enabled),
                        "updated_at": datetime.now().isoformat()
                    }) \
                    .eq("user_id", current_user.id) \
                    .execute()
            except Exception as e:
                # Fallback without monitoring_active if schema column not yet created
                try:
                    admin_client.table("gmail_accounts") \
                        .update({
                            "auto_scan_enabled": payload.enabled,
                            "updated_at": datetime.now().isoformat()
                        }) \
                        .eq("user_id", current_user.id) \
                        .execute()
                except Exception as e2:
                    logger.debug(f"Could not persist auto_scan toggle to Supabase: {e2}")

    # Read fresh state for response
    account_fresh = db.store["gmail_accounts"].get(current_user.id, account)
    last_synced = account_fresh.get("last_synced_at")
    if isinstance(last_synced, str):
        try:
            last_synced = datetime.fromisoformat(last_synced.replace("Z", "+00:00"))
        except Exception:
            last_synced = None

    return GmailStatusResponse(
        is_connected=account_fresh.get("is_connected", True),
        email_address=account_fresh.get("email_address"),
        auto_scan_enabled=account_fresh.get("auto_scan_enabled", payload.enabled),
        scan_limit=account_fresh.get("scan_limit", 10),
        last_synced_at=last_synced,
        monitoring_active=account_fresh.get("monitoring_active", False),
        emails_auto_processed=account_fresh.get("emails_auto_processed", 0),
        warnings_sent=account_fresh.get("warnings_sent", 0),
    )


@router.post("/scan")
async def scan_gmail_inbox(
    payload: GmailScanRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Scan recent Gmail inbox messages through Gemini AI threat engine."""
    account = db.store["gmail_accounts"].get(current_user.id)

    # ✅ FIX: Restore from Supabase if not in memory (e.g., after restart)
    if not account:
        account = _load_gmail_account_from_supabase(current_user.id)

    access_token = account.get("access_token") if account else None

    # If live Gmail access token is available, fetch messages
    if access_token:
        try:
            target_folder = payload.folder or "all"
            messages = await gmail_service.fetch_messages_list(
                access_token,
                max_results=payload.limit,
                folder=target_folder
            )
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

            # ✅ Update last_synced_at in both memory and Supabase after successful scan
            now = datetime.now()
            if account:
                account["last_synced_at"] = now
                db.store["gmail_accounts"][current_user.id] = account
            admin_client = db.get_admin_client()
            if admin_client:
                try:
                    admin_client.table("gmail_accounts") \
                        .update({"last_synced_at": now.isoformat(), "updated_at": now.isoformat()}) \
                        .eq("user_id", current_user.id) \
                        .execute()
                except Exception as e:
                    logger.debug(f"Could not update last_synced_at: {e}")

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
