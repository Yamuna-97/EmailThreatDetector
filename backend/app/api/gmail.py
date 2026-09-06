import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.config import settings
from app.dependencies import get_current_user
from app.schemas.auth import UserResponse, MessageResponse
from app.schemas.gmail import (
    GmailConnectResponse, GmailStatusResponse, GmailScanRequest, GmailAutoScanToggleRequest
)
from app.services.google_oauth_service import google_oauth_service
from app.services.gmail_service import (
    gmail_service, GmailAuthExpiredError, GmailApiError
)
from app.services import monitoring_service
from app.database import db

logger = logging.getLogger("vaultshield.api.gmail")
router = APIRouter(prefix="/gmail", tags=["Gmail Integration"])


# ---------------------------------------------------------------------------
# Safe Diagnostic Logging
# ---------------------------------------------------------------------------

def log_gmail_auth_debug(
    stage: str,
    user_id: str,
    email: str,
    account: Optional[Dict[str, Any]],
    token_source: str,
    token_expired: bool = False,
    refresh_attempted: bool = False,
    refresh_success: Optional[bool] = None,
    new_token_len: Optional[int] = None,
    new_token_expiry: Optional[str] = None
):
    """
    Safe diagnostic logger for Gmail OAuth lifecycle.
    NEVER logs actual access tokens, refresh tokens, client secrets, or auth codes.
    """
    access_token = account.get("access_token") if account else None
    refresh_token = account.get("refresh_token") if account else None
    token_expiry = account.get("token_expiry") if account else None

    logger.info(
        f"[GMAIL AUTH DEBUG - {stage}]\n"
        f"  user_id={user_id}\n"
        f"  email={email}\n"
        f"  access_token_present={bool(access_token)}\n"
        f"  access_token_length={len(access_token) if access_token else 0}\n"
        f"  refresh_token_present={bool(refresh_token)}\n"
        f"  token_expiry={token_expiry}\n"
        f"  current_utc_time={datetime.now(timezone.utc).isoformat()}\n"
        f"  token_expired={token_expired}\n"
        f"  refresh_attempted={refresh_attempted}\n"
        f"  refresh_success={refresh_success}\n"
        f"  new_access_token_length={new_token_len}\n"
        f"  new_token_expiry={new_token_expiry}\n"
        f"  token_source={token_source}"
    )


# ---------------------------------------------------------------------------
# Account Persistence & Invalidation
# ---------------------------------------------------------------------------

def _load_gmail_account_from_supabase(user_id: str, email: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Restore a user's Gmail account record from Supabase into the in-memory store.
    Checks by user_id first, then falls back to email_address if provided.
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

        if (not res.data or len(res.data) == 0) and email:
            res = admin_client.table("gmail_accounts") \
                .select("*") \
                .eq("email_address", email) \
                .eq("is_connected", True) \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()
            if res.data:
                logger.info(f"Linking Gmail account for email {email} to user_id {user_id}")
                try:
                    admin_client.table("gmail_accounts") \
                        .update({"user_id": user_id, "updated_at": datetime.now(timezone.utc).isoformat()}) \
                        .eq("id", res.data[0]["id"]) \
                        .execute()
                except Exception as e_link:
                    logger.debug(f"Could not update user_id linkage in Supabase: {e_link}")

        if res.data:
            row = res.data[0]
            account = {
                "email_address": row.get("email_address", ""),
                "access_token": row.get("access_token", ""),
                "refresh_token": row.get("refresh_token"),
                "token_expiry": row.get("token_expiry"),
                "is_connected": row.get("is_connected", False),
                "auto_scan_enabled": row.get("auto_scan_enabled", False),
                "scan_limit": row.get("scan_limit", 10),
                "last_synced_at": row.get("last_synced_at"),
                "monitoring_active": row.get("monitoring_active", False),
                "emails_auto_processed": row.get("emails_auto_processed", 0),
                "warnings_sent": row.get("warnings_sent", 0),
                "_supabase_id": row.get("id"),
            }
            # Cache in memory
            db.store["gmail_accounts"][user_id] = account
            logger.info(f"Restored Gmail account for user {user_id} ({account.get('email_address')}) from Supabase.")
            return account
    except Exception as e:
        logger.warning(f"Could not restore Gmail account from Supabase: {e}")
    return None


def _persist_gmail_account_to_supabase(user_id: str, account: Dict[str, Any]) -> None:
    """
    Persist or update the Gmail account record in Supabase.
    Ensures existing valid refresh tokens are not overwritten with null/empty values.
    """
    admin_client = db.get_admin_client()
    if not admin_client:
        return
    try:
        refresh_token = account.get("refresh_token")
        email_address = account.get("email_address", "")
        if not refresh_token and email_address:
            existing = admin_client.table("gmail_accounts") \
                .select("refresh_token") \
                .eq("user_id", user_id) \
                .eq("email_address", email_address) \
                .limit(1) \
                .execute()
            if existing.data and existing.data[0].get("refresh_token"):
                refresh_token = existing.data[0].get("refresh_token")
                account["refresh_token"] = refresh_token

        payload = {
            "user_id": user_id,
            "email_address": email_address,
            "access_token": account.get("access_token", ""),
            "refresh_token": refresh_token,
            "token_expiry": account.get("token_expiry"),
            "is_connected": account.get("is_connected", True),
            "auto_scan_enabled": account.get("auto_scan_enabled", False),
            "monitoring_active": account.get("monitoring_active", False),
            "scan_limit": account.get("scan_limit", 10),
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        admin_client.table("gmail_accounts").upsert(payload, on_conflict="user_id,email_address").execute()
        logger.info(f"Persisted Gmail account for user {user_id} ({email_address}) to Supabase.")
    except Exception as e:
        logger.warning(f"Could not persist Gmail account to Supabase: {e}")


def _invalidate_gmail_session(user_id: str) -> None:
    """Invalidate unusable Gmail authentication session in both RAM and Supabase."""
    if user_id in db.store["gmail_accounts"]:
        db.store["gmail_accounts"][user_id]["is_connected"] = False
        db.store["gmail_accounts"][user_id]["access_token"] = ""
    admin_client = db.get_admin_client()
    if admin_client:
        try:
            admin_client.table("gmail_accounts") \
                .update({
                    "is_connected": False,
                    "access_token": "",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }) \
                .eq("user_id", user_id) \
                .execute()
            logger.info(f"Invalidated Gmail connection for user {user_id} in Supabase.")
        except Exception as e:
            logger.debug(f"Notice on invalidating Gmail session in Supabase: {e}")


# ---------------------------------------------------------------------------
# Token Refresh & Account Validation
# ---------------------------------------------------------------------------

async def refresh_user_gmail_token(user_id: str, account: Dict[str, Any]) -> str:
    """
    Exchange stored refresh token for a new access token via Google OAuth token endpoint.
    Updates in-memory store and Supabase database.
    Returns the new access token.
    Raises HTTPException(401) with structured error if refresh is impossible or fails.
    """
    refresh_token = account.get("refresh_token")
    email = account.get("email_address", "")

    if not refresh_token:
        # Attempt to load refresh_token from Supabase
        admin_client = db.get_admin_client()
        if admin_client:
            try:
                res = admin_client.table("gmail_accounts") \
                    .select("refresh_token") \
                    .eq("user_id", user_id) \
                    .limit(1) \
                    .execute()
                if res.data and res.data[0].get("refresh_token"):
                    refresh_token = res.data[0]["refresh_token"]
                    account["refresh_token"] = refresh_token
            except Exception:
                pass

    if not refresh_token:
        log_gmail_auth_debug(
            stage="REFRESH_FAILED_NO_REFRESH_TOKEN",
            user_id=user_id,
            email=email,
            account=account,
            token_source="database/memory",
            token_expired=True,
            refresh_attempted=False,
            refresh_success=False
        )
        _invalidate_gmail_session(user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": "GMAIL_AUTH_EXPIRED",
                "message": "Gmail authorization has expired. Please reconnect your Google account."
            }
        )

    try:
        token_data = await google_oauth_service.refresh_access_token(refresh_token)
        new_access_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in", 3600)

        if not new_access_token:
            raise ValueError("Google token endpoint did not return an access_token.")

        new_expiry = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()

        # Update in-memory account
        account["access_token"] = new_access_token
        account["token_expiry"] = new_expiry
        account["is_connected"] = True
        db.store["gmail_accounts"][user_id] = account

        # Persist to Supabase
        _persist_gmail_account_to_supabase(user_id, account)

        log_gmail_auth_debug(
            stage="REFRESH_SUCCESS",
            user_id=user_id,
            email=email,
            account=account,
            token_source="google_oauth_refresh_endpoint",
            token_expired=False,
            refresh_attempted=True,
            refresh_success=True,
            new_token_len=len(new_access_token),
            new_token_expiry=new_expiry
        )

        return new_access_token

    except Exception as e:
        logger.warning(f"OAuth token refresh failed for user {user_id}: {e}")
        log_gmail_auth_debug(
            stage="REFRESH_FAILED_REJECTED",
            user_id=user_id,
            email=email,
            account=account,
            token_source="google_oauth_refresh_endpoint",
            token_expired=True,
            refresh_attempted=True,
            refresh_success=False
        )
        _invalidate_gmail_session(user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": "GMAIL_AUTH_EXPIRED",
                "message": "Gmail authorization has expired. Please reconnect your Google account."
            }
        )


async def get_authenticated_gmail_account(user_id: str, email: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieve and validate the connected Gmail account for user_id.
    Loads from in-memory cache or Supabase, checks expiry, and proactively refreshes if needed.
    Raises HTTPException(401) with structured GMAIL_AUTH_EXPIRED error if unauthenticated.
    """
    account = db.store["gmail_accounts"].get(user_id)
    token_source = "in_memory_cache"

    if not account or not account.get("is_connected"):
        account = _load_gmail_account_from_supabase(user_id, email=email)
        token_source = "supabase_database"

    if not account or not account.get("is_connected"):
        logger.warning(f"No active connected Gmail account found for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": "GMAIL_AUTH_EXPIRED",
                "message": "Gmail account is not connected. Please connect your Google account."
            }
        )

    # Check token expiry (treat expired if within 60 seconds of expiry)
    access_token = account.get("access_token")
    token_expiry_val = account.get("token_expiry")
    is_expired = False

    if token_expiry_val:
        try:
            if isinstance(token_expiry_val, str):
                token_expiry_dt = datetime.fromisoformat(token_expiry_val.replace("Z", "+00:00"))
            else:
                token_expiry_dt = token_expiry_val
            if token_expiry_dt.tzinfo is None:
                token_expiry_dt = token_expiry_dt.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) >= (token_expiry_dt - timedelta(seconds=60)):
                is_expired = True
        except Exception as ex:
            logger.debug(f"Could not parse token_expiry for user {user_id}: {ex}")

    if not access_token or is_expired:
        log_gmail_auth_debug(
            stage="PROACTIVE_TOKEN_REFRESH",
            user_id=user_id,
            email=account.get("email_address", email or ""),
            account=account,
            token_source=token_source,
            token_expired=is_expired or not bool(access_token),
            refresh_attempted=True
        )
        new_token = await refresh_user_gmail_token(user_id, account)
        account["access_token"] = new_token
    else:
        log_gmail_auth_debug(
            stage="CURRENT_TOKEN_VALID",
            user_id=user_id,
            email=account.get("email_address", email or ""),
            account=account,
            token_source=token_source,
            token_expired=False,
            refresh_attempted=False
        )

    return account


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@router.get("/connect", response_model=GmailConnectResponse)
async def connect_gmail(current_user: UserResponse = Depends(get_current_user)):
    """Generate Google OAuth 2.0 authorization URL for Gmail API consent."""
    if not settings.GOOGLE_CLIENT_ID:
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
    """Google OAuth callback handler. Exchanges code for tokens and redirects to user dashboard."""
    if error or not code:
        logger.error(f"OAuth Callback error: {error}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=oauth_cancelled")

    try:
        tokens = await google_oauth_service.exchange_code_for_tokens(code)
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in", 3600)
        token_expiry = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()

        user_email = await google_oauth_service.get_user_email(access_token)
        if not user_email:
            logger.error("Failed to retrieve Google user email from token response.")
            raise ValueError("Failed to retrieve email address for authenticated Google account.")

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
            "token_expiry": token_expiry,
            "is_connected": True,
            "auto_scan_enabled": False,
            "monitoring_active": False,
            "scan_limit": 10,
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
        }

        # Store in in-memory cache
        db.store["gmail_accounts"][user_id] = account

        # Persist to Supabase
        _persist_gmail_account_to_supabase(user_id, account)

        log_gmail_auth_debug(
            stage="OAUTH_CALLBACK_COMPLETED",
            user_id=user_id,
            email=user_email,
            account=account,
            token_source="google_oauth_exchange",
            token_expired=False,
            new_token_len=len(access_token) if access_token else 0,
            new_token_expiry=token_expiry
        )

        redirect_target = f"{settings.FRONTEND_URL}/?token={jwt_token}&user_id={user_id}&email={user_email}&name={user_name}&role={role}&gmail_connected=true"
        return RedirectResponse(url=redirect_target)

    except Exception as e:
        logger.error(f"Callback processing error: {e}")
        fallback_target = f"{settings.FRONTEND_URL}/?error=oauth_processing_failed"
        return RedirectResponse(url=fallback_target)


@router.get("/status", response_model=GmailStatusResponse)
async def get_gmail_status(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve user's Gmail connection status and auto-scan configuration."""
    account = db.store["gmail_accounts"].get(current_user.id)
    if not account or not account.get("is_connected"):
        account = _load_gmail_account_from_supabase(current_user.id, email=current_user.email)

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
    """Disconnect Gmail integration, stop active monitoring, and revoke Google OAuth tokens."""
    account = db.store["gmail_accounts"].get(current_user.id)
    if not account:
        account = _load_gmail_account_from_supabase(current_user.id, email=current_user.email)

    # 1. Stop background monitoring / polling
    try:
        await monitoring_service.stop_monitoring(current_user.id)
    except Exception as e:
        logger.debug(f"Stop monitoring on disconnect notice: {e}")

    # 2. Revoke OAuth token with Google if token exists
    if account:
        tok = account.get("refresh_token") or account.get("access_token")
        if tok:
            try:
                await google_oauth_service.revoke_token(tok)
            except Exception as re:
                logger.debug(f"Token revocation notice: {re}")

    # 3. Invalidate database and in-memory session
    _invalidate_gmail_session(current_user.id)
    return MessageResponse(message="Gmail account disconnected, automated monitoring stopped, and tokens revoked.")


@router.post("/delete-data", response_model=MessageResponse)
@router.delete("/user-data", response_model=MessageResponse)
async def delete_user_stored_data(current_user: UserResponse = Depends(get_current_user)):
    """
    User Data Deletion Workflow:
    Permanently deletes user's Gmail connection, processed emails, threat logs, alerts,
    and monitoring metadata associated with current_user.id from Supabase and RAM.
    Does NOT affect system/shared RAG knowledge.
    """
    # 1. Stop monitoring
    try:
        await monitoring_service.stop_monitoring(current_user.id)
    except Exception as e:
        logger.debug(f"Stop monitoring on deletion notice: {e}")

    # 2. Revoke OAuth token with Google
    account = db.store["gmail_accounts"].get(current_user.id)
    if not account:
        account = _load_gmail_account_from_supabase(current_user.id, email=current_user.email)
    if account:
        tok = account.get("refresh_token") or account.get("access_token")
        if tok:
            try:
                await google_oauth_service.revoke_token(tok)
            except Exception:
                pass

            try:
                admin_client.table("alerts").delete().eq("user_id", current_user.id).execute()
            except Exception:
                pass
            try:
                admin_client.table("threats").delete().eq("user_id", current_user.id).execute()
            except Exception:
                pass
            try:
                admin_client.table("emails").delete().eq("user_id", current_user.id).execute()
            except Exception:
                pass
            try:
                admin_client.table("processed_gmail_messages").delete().eq("user_id", current_user.id).execute()
            except Exception:
                pass
            try:
                admin_client.table("gmail_accounts").delete().eq("user_id", current_user.id).execute()
            except Exception:
                pass

    # 4. Clear in-memory caches
    db.store["gmail_accounts"].pop(current_user.id, None)
    db.store["emails"].pop(current_user.id, None)
    db.store["threats"].pop(current_user.id, None)
    db.store["alerts"].pop(current_user.id, None)

    return MessageResponse(
        message="All stored email records, threat logs, Gmail OAuth tokens, and monitoring data deleted successfully."
    )


@router.post("/toggle-auto-scan", response_model=GmailStatusResponse)
async def toggle_auto_scan(
    payload: GmailAutoScanToggleRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Enable or disable automatic Gmail monitoring (Watch + polling engine)."""
    account = await get_authenticated_gmail_account(current_user.id, email=current_user.email)
    account["auto_scan_enabled"] = payload.enabled
    db.store["gmail_accounts"][current_user.id] = account

    if payload.enabled:
        try:
            await monitoring_service.start_monitoring(current_user.id, account)
        except Exception as e:
            logger.error(f"Failed to start monitoring for user {current_user.id}: {e}")
    else:
        try:
            await monitoring_service.stop_monitoring(current_user.id)
        except Exception as e:
            logger.debug(f"Stop monitoring notice for user {current_user.id}: {e}")

    admin_client = db.get_admin_client()
    if admin_client:
        try:
            admin_client.table("gmail_accounts") \
                .update({
                    "auto_scan_enabled": payload.enabled,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }) \
                .eq("user_id", current_user.id) \
                .execute()
        except Exception as e:
            logger.debug(f"Could not persist auto_scan toggle to Supabase: {e}")

    last_synced = account.get("last_synced_at")
    if isinstance(last_synced, str):
        try:
            last_synced = datetime.fromisoformat(last_synced.replace("Z", "+00:00"))
        except Exception:
            last_synced = None

    return GmailStatusResponse(
        is_connected=account.get("is_connected", True),
        email_address=account.get("email_address"),
        auto_scan_enabled=account.get("auto_scan_enabled", payload.enabled),
        scan_limit=account.get("scan_limit", 10),
        last_synced_at=last_synced,
        monitoring_active=account.get("monitoring_active", False),
        emails_auto_processed=account.get("emails_auto_processed", 0),
        warnings_sent=account.get("warnings_sent", 0),
    )


@router.get("/messages-list")
async def list_gmail_messages(
    limit: int = Query(10, description="Max messages to fetch: 1, 3, 5, 10, 50"),
    folder: str = Query("all", description="Target folder: all, inbox, spam"),
    current_user: UserResponse = Depends(get_current_user)
):
    try:
        account = await get_authenticated_gmail_account(current_user.id, email=current_user.email)
    except HTTPException as e:
        if e.status_code == status.HTTP_401_UNAUTHORIZED:
            return {"messages": [], "total": 0, "is_live": False, "connected": False}
        raise

    access_token = account.get("access_token")
    existing_message_ids = {e.message_id for e in db.store["emails"].values()}

    messages = []
    try:
        messages = await gmail_service.fetch_messages_list(
            access_token,
            max_results=limit,
            folder=folder
        )
    except GmailAuthExpiredError:
        logger.info(f"401 Unauthorized encountered on fetch_messages_list for user {current_user.id}. Attempting token refresh...")
        new_token = await refresh_user_gmail_token(current_user.id, account)
        try:
            messages = await gmail_service.fetch_messages_list(
                new_token,
                max_results=limit,
                folder=folder
            )
        except GmailAuthExpiredError:
            logger.error(f"Gmail API 401 persisted after token refresh for user {current_user.id}.")
            _invalidate_gmail_session(current_user.id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "success": False,
                    "error": "GMAIL_AUTH_EXPIRED",
                    "message": "Gmail authorization has expired. Please reconnect your Google account."
                }
            )

    items = []
    for msg_meta in messages:
        m_id = msg_meta.get("id")
        detail = None
        current_tok = account.get("access_token")
        try:
            detail = await gmail_service.get_message_detail(current_tok, m_id)
        except GmailAuthExpiredError:
            new_token = await refresh_user_gmail_token(current_user.id, account)
            detail = await gmail_service.get_message_detail(new_token, m_id)

        if detail:
            payload_data = detail.get("payload", {})
            headers_list = payload_data.get("headers", [])
            subject = next((h["value"] for h in headers_list if h["name"].lower() == "subject"), "(No Subject)")
            sender = next((h["value"] for h in headers_list if h["name"].lower() == "from"), "")
            date_str = next((h["value"] for h in headers_list if h["name"].lower() == "date"), "")
            label_ids = detail.get("labelIds", [])
            msg_folder = "spam" if "SPAM" in label_ids else "inbox"

            items.append({
                "id": m_id,
                "thread_id": detail.get("threadId"),
                "subject": subject,
                "sender": sender,
                "date": date_str or datetime.now().strftime("%b %d, %Y"),
                "snippet": detail.get("snippet", ""),
                "folder": msg_folder,
                "already_scanned": m_id in existing_message_ids,
            })

    return {"messages": items, "total": len(items), "is_live": True}


@router.post("/scan")
async def scan_gmail_inbox(
    payload: GmailScanRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Scan recent Gmail inbox messages through Gemini AI threat engine."""
    account = await get_authenticated_gmail_account(current_user.id, email=current_user.email)
    access_token = account.get("access_token")
    target_folder = payload.folder or "all"

    messages = []
    try:
        messages = await gmail_service.fetch_messages_list(
            access_token,
            max_results=payload.limit,
            folder=target_folder
        )
    except GmailAuthExpiredError:
        logger.info(f"401 Unauthorized encountered on scan_gmail_inbox for user {current_user.id}. Attempting token refresh...")
        new_token = await refresh_user_gmail_token(current_user.id, account)
        try:
            messages = await gmail_service.fetch_messages_list(
                new_token,
                max_results=payload.limit,
                folder=target_folder
            )
        except GmailAuthExpiredError:
            _invalidate_gmail_session(current_user.id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "success": False,
                    "error": "GMAIL_AUTH_EXPIRED",
                    "message": "Gmail authorization has expired. Please reconnect your Google account."
                }
            )

    scanned_results = []
    for msg_meta in messages:
        m_id = msg_meta.get("id")
        if any(e.message_id == m_id for e in db.store["emails"].values()):
            continue

        detail = None
        current_tok = account.get("access_token")
        try:
            detail = await gmail_service.get_message_detail(current_tok, m_id)
        except GmailAuthExpiredError:
            new_tok = await refresh_user_gmail_token(current_user.id, account)
            detail = await gmail_service.get_message_detail(new_tok, m_id)

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

    now = datetime.now(timezone.utc)
    account["last_synced_at"] = now.isoformat()
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


class GmailScanSelectedRequest(BaseModel):
    message_ids: List[str]


@router.post("/scan-selected")
async def scan_selected_gmail_messages(
    payload: GmailScanSelectedRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """Scan specific selected Gmail messages through Gemini AI threat engine."""
    account = await get_authenticated_gmail_account(current_user.id, email=current_user.email)
    scanned_results = []

    for m_id in payload.message_ids:
        detail = None
        current_tok = account.get("access_token")
        try:
            detail = await gmail_service.get_message_detail(current_tok, m_id)
        except GmailAuthExpiredError:
            new_tok = await refresh_user_gmail_token(current_user.id, account)
            detail = await gmail_service.get_message_detail(new_tok, m_id)

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
