"""
VaultShield Automatic Gmail Monitoring Service
==============================================
Implements automatic monitoring of a user's Gmail Inbox + Spam using
Gmail Watch API + Google Cloud Pub/Sub push notifications (production)
with a transparent fallback to periodic polling (local development / no GCP setup).

Architecture:
  Production  : Gmail API → Gmail Watch → GCP Pub/Sub topic → Push subscription
                → POST /api/gmail/monitor/pubsub/push → this service
  Fallback    : asyncio background task polls Gmail every N seconds

Both paths share the same processing core:
  fetch detail → deduplicate → threat pipeline → optional SMTP warning
"""

import asyncio
import base64
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.database import db
from app.services.google_oauth_service import google_oauth_service
from app.services.gmail_service import gmail_service, GmailAuthExpiredError, GmailApiError
from app.services.smtp_service import smtp_alert_service

logger = logging.getLogger("vaultshield.monitoring")

GMAIL_WATCH_URL = "https://gmail.googleapis.com/gmail/v1/users/me/watch"
GMAIL_STOP_URL = "https://gmail.googleapis.com/gmail/v1/users/me/stop"
GMAIL_HISTORY_URL = "https://gmail.googleapis.com/gmail/v1/users/me/history"
GMAIL_MESSAGES_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

# Background polling task handles (keyed by user_id)
_polling_tasks: Dict[str, asyncio.Task] = {}


# ---------------------------------------------------------------------------
# Token management
# ---------------------------------------------------------------------------

async def refresh_access_token(user_id: str, account: Dict[str, Any]) -> Optional[str]:
    """
    Use the stored refresh_token to obtain a fresh access_token.
    Updates both in-memory store and Supabase on success.
    Returns the new access_token, or None on failure.
    """
    refresh_token = account.get("refresh_token")
    if not refresh_token:
        # Check Supabase
        admin_client = db.get_admin_client()
        if admin_client:
            try:
                res = admin_client.table("gmail_accounts").select("refresh_token").eq("user_id", user_id).limit(1).execute()
                if res.data and res.data[0].get("refresh_token"):
                    refresh_token = res.data[0]["refresh_token"]
                    account["refresh_token"] = refresh_token
            except Exception:
                pass

    if not refresh_token:
        logger.warning(f"[monitor] No refresh_token stored for user {user_id}; cannot refresh.")
        return None

    try:
        token_data = await google_oauth_service.refresh_access_token(refresh_token)
        new_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in", 3600)
        from datetime import timedelta
        token_expiry = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()

        if new_token:
            account["access_token"] = new_token
            account["token_expiry"] = token_expiry
            account["is_connected"] = True
            db.store["gmail_accounts"][user_id] = account
            # Persist to Supabase
            admin_client = db.get_admin_client()
            if admin_client:
                try:
                    admin_client.table("gmail_accounts") \
                        .update({
                            "access_token": new_token,
                            "token_expiry": token_expiry,
                            "is_connected": True,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }) \
                        .eq("user_id", user_id) \
                        .execute()
                except Exception as e:
                    logger.debug(f"[monitor] Supabase token update notice: {e}")
            logger.info(f"[monitor] Refreshed access_token for user {user_id}")
            return new_token
        logger.warning(f"[monitor] Token refresh did not return access_token for user {user_id}")
    except Exception as e:
        err_msg = str(e)
        logger.warning(f"[monitor] Token refresh error for user {user_id}: {err_msg}")
        # If refresh token is permanently invalid or revoked by Google (e.g. invalid_grant), stop polling loop
        if "invalid_grant" in err_msg.lower() or "400" in err_msg or "expired" in err_msg.lower() or "revoked" in err_msg.lower():
            logger.info(f"[monitor] Revoked or expired OAuth grant for user {user_id}. Marking disconnected and stopping polling.")
            account["is_connected"] = False
            account["monitoring_active"] = False
            db.store["gmail_accounts"][user_id] = account
            _cancel_polling_task(user_id)
            admin_client = db.get_admin_client()
            if admin_client:
                try:
                    admin_client.table("gmail_accounts") \
                        .update({
                            "is_connected": False,
                            "monitoring_active": False,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }) \
                        .eq("user_id", user_id) \
                        .execute()
                except Exception as dbe:
                    logger.debug(f"[monitor] Supabase mark disconnected notice: {dbe}")
            try:
                from app.services.alert_service import alert_service
                alert_service.create_alert(
                    user_id=user_id,
                    title="🔴 Google Account Disconnected",
                    message="Google OAuth authorization token expired or was revoked. Please reconnect in settings to resume automated 60s detection.",
                    severity="high"
                )
            except Exception as ale:
                logger.debug(f"Alert creation notice: {ale}")
    return None



async def _get_valid_token(user_id: str, account: Dict[str, Any]) -> Optional[str]:
    """
    Return a valid access_token. On 401-style failures the caller should call
    refresh_access_token() and retry once.
    """
    return account.get("access_token")


# ---------------------------------------------------------------------------
# Duplicate-processing guard
# ---------------------------------------------------------------------------

def _proc_key(user_id: str, gmail_message_id: str) -> str:
    return f"{user_id}:{gmail_message_id}"


def is_message_processed(gmail_message_id: str, user_id: str) -> bool:
    """Check in-memory set first (fast path), then Supabase (slow path)."""
    key = _proc_key(user_id, gmail_message_id)
    if key in db.store["processed_messages"]:
        return True
    # Slow path: check Supabase
    admin_client = db.get_admin_client()
    if admin_client:
        try:
            res = admin_client.table("processed_gmail_messages") \
                .select("id") \
                .eq("gmail_message_id", gmail_message_id) \
                .eq("user_id", user_id) \
                .limit(1) \
                .execute()
            if res.data:
                # Cache in memory for future fast-path
                db.store["processed_messages"][key] = {"status": "done"}
                return True
        except Exception as e:
            logger.debug(f"[monitor] Supabase processed_messages check notice: {e}")
    return False


def mark_message_processing(gmail_message_id: str, user_id: str) -> None:
    """Claim this message ID for processing (atomic claim in memory)."""
    key = _proc_key(user_id, gmail_message_id)
    db.store["processed_messages"][key] = {"status": "processing", "warning_sent": False}


def mark_message_done(
    gmail_message_id: str,
    user_id: str,
    threat_severity: Optional[str],
    warning_sent: bool,
) -> None:
    """Persist final processing result for a message."""
    key = _proc_key(user_id, gmail_message_id)
    db.store["processed_messages"][key] = {
        "status": "done",
        "severity": threat_severity,
        "warning_sent": warning_sent,
    }
    # Persist to Supabase
    admin_client = db.get_admin_client()
    if admin_client:
        try:
            admin_client.table("processed_gmail_messages").upsert({
                "gmail_message_id": gmail_message_id,
                "user_id": user_id,
                "processing_status": "done",
                "threat_severity": threat_severity,
                "warning_email_sent": warning_sent,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }, on_conflict="gmail_message_id,user_id").execute()
        except Exception as e:
            logger.debug(f"[monitor] Supabase processed_gmail_messages upsert notice: {e}")


def mark_message_failed(gmail_message_id: str, user_id: str) -> None:
    """Mark message as failed so it can be retried."""
    key = _proc_key(user_id, gmail_message_id)
    # Remove from memory so next poll will retry
    db.store["processed_messages"].pop(key, None)


# ---------------------------------------------------------------------------
# Core: process a single Gmail message
# ---------------------------------------------------------------------------

async def _process_single_message(
    user_id: str,
    account: Dict[str, Any],
    message_id: str,
    access_token: str,
) -> bool:
    """
    Full pipeline for one Gmail message:
      1. Skip if already processed
      2. Fetch full message detail
      3. Determine Inbox / Spam label
      4. Extract fields
      5. Run threat analysis pipeline
      6. Send SMTP warning if dangerous (high/critical OR risk_score >= 65)
      7. Mark as done

    Returns True if successfully processed (even if safe), False if skipped/error.
    """
    if is_message_processed(message_id, user_id):
        logger.debug(f"[monitor] Skipping already-processed message {message_id} for user {user_id}")
        return False

    # Claim it immediately to prevent concurrent duplicate processing
    mark_message_processing(message_id, user_id)

    try:
        detail = None
        try:
            detail = await gmail_service.get_message_detail(access_token, message_id)
        except GmailAuthExpiredError:
            new_token = await refresh_access_token(user_id, account)
            if new_token:
                access_token = new_token
                detail = await gmail_service.get_message_detail(new_token, message_id)

        if not detail:
            logger.warning(f"[monitor] Could not fetch message {message_id}; skipping.")
            mark_message_failed(message_id, user_id)
            return False


        payload_data = detail.get("payload", {})
        headers_list = payload_data.get("headers", [])

        def _hdr(name: str) -> str:
            return next((h["value"] for h in headers_list if h["name"].lower() == name.lower()), "")

        subject = _hdr("subject") or "(No Subject)"
        sender = _hdr("from") or "unknown@unknown.com"
        recipient = _hdr("to") or account.get("email_address", "")
        body = gmail_service._extract_body_from_payload(payload_data) or detail.get("snippet", "")

        # Determine inbox/spam label
        label_ids: List[str] = detail.get("labelIds", [])
        location = "spam" if "SPAM" in label_ids else "inbox"
        logger.info(f"[monitor] Processing {location} message {message_id} from {sender!r} | subject: {subject!r}")

        # Run existing threat analysis pipeline
        result = await gmail_service.process_and_scan_email(
            user_id=user_id,
            message_id=message_id,
            thread_id=detail.get("threadId"),
            sender=sender,
            recipient=recipient,
            subject=subject,
            body=body,
            headers_data=headers_list,
        )

        threat = result.get("threat")
        threat_severity = threat.severity if threat else None
        final_risk_score = threat.risk_score if threat else 0

        # Update auto-processed counter
        _increment_account_counter(user_id, "emails_auto_processed")

        # Determine if warning email should be sent
        # The existing smtp_service sends on critical / risk>=75 already inside process_and_scan_email.
        # For auto-monitoring we also want to send for high severity (risk >= 65) and use the user's
        # own Gmail address as recipient (not whatever "To" header says).
        warning_sent = False
        dangerous_severities = {"high", "critical"}
        if threat_severity in dangerous_severities or final_risk_score >= 65:
            user_email = account.get("email_address", "")
            if user_email:
                try:
                    # send_critical_threat_alert_async already fires-and-forgets in existing code
                    # but only for risk>=75. Re-call it here for high severity (risk 65-74) cases.
                    # For risk>=75 cases it was already called inside process_and_scan_email;
                    # we avoid double-sending by checking risk < 75.
                    if final_risk_score < 75 and threat_severity in dangerous_severities:
                        email_data = result.get("email")
                        analysis_data = result.get("analysis")
                        await smtp_alert_service.send_critical_threat_alert_async(
                            recipient_email=user_email,
                            threat_data=threat.model_dump() if threat else {},
                            email_data=email_data.model_dump() if email_data else {},
                            analysis_data=analysis_data.model_dump() if analysis_data else {},
                        )
                    warning_sent = True
                    _increment_account_counter(user_id, "warnings_sent")
                except Exception as e:
                    logger.warning(f"[monitor] Warning email error for message {message_id}: {e}")
            # For risk >= 75, the existing pipeline already sent the warning; count it
            elif final_risk_score >= 75:
                warning_sent = True
                _increment_account_counter(user_id, "warnings_sent")

        mark_message_done(message_id, user_id, threat_severity, warning_sent)

        # Persist notification into Supabase alerts table
        try:
            from app.services.alert_service import alert_service
            if threat_severity in dangerous_severities or final_risk_score >= 65:
                alert_service.create_alert(
                    user_id=user_id,
                    threat_id=threat.id if threat else None,
                    title=f"🚨 High Threat Detected: {threat.threat_type if threat else 'Suspicious Email'}",
                    message=f"Urgent threat flagged from {sender}. Risk Score: {final_risk_score}/100. Subject: {subject}",
                    severity=threat_severity or "critical"
                )
            else:
                alert_service.create_alert(
                    user_id=user_id,
                    threat_id=threat.id if threat else None,
                    title=f"📥 New Email Analyzed: {subject[:40]}",
                    message=f"Incoming email from {sender} analyzed via automated detection (Risk: {final_risk_score}/100).",
                    severity="low"
                )
        except Exception as ale:
            logger.debug(f"[monitor] Alert creation notice: {ale}")

        # Update last_event_time in account
        _update_account_field(user_id, "last_event_time", datetime.now(timezone.utc).isoformat())

        logger.info(
            f"[monitor] ✓ message={message_id} severity={threat_severity} "
            f"risk={final_risk_score} warning_sent={warning_sent}"
        )
        return True

    except Exception as e:
        logger.error(f"[monitor] Error processing message {message_id} for user {user_id}: {e}", exc_info=True)
        mark_message_failed(message_id, user_id)
        return False


def _increment_account_counter(user_id: str, field: str) -> None:
    """Thread-safe-ish increment of an integer counter on the gmail_accounts record."""
    account = db.store["gmail_accounts"].get(user_id, {})
    account[field] = account.get(field, 0) + 1
    db.store["gmail_accounts"][user_id] = account
    admin_client = db.get_admin_client()
    if admin_client:
        try:
            # Use raw SQL increment via rpc or just re-read+write (simpler)
            res = admin_client.table("gmail_accounts").select(field).eq("user_id", user_id).limit(1).execute()
            current = res.data[0].get(field, 0) if res.data else 0
            admin_client.table("gmail_accounts") \
                .update({field: current + 1, "updated_at": datetime.now(timezone.utc).isoformat()}) \
                .eq("user_id", user_id).execute()
        except Exception as e:
            logger.debug(f"[monitor] Counter increment notice ({field}): {e}")


def _update_account_field(user_id: str, field: str, value: Any) -> None:
    account = db.store["gmail_accounts"].get(user_id, {})
    account[field] = value
    db.store["gmail_accounts"][user_id] = account


# ---------------------------------------------------------------------------
# Gmail Watch API
# ---------------------------------------------------------------------------

async def start_gmail_watch(user_id: str, account: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Call Gmail users.watch() to register a Pub/Sub topic for push notifications.
    Returns the watch response dict (expiration, historyId) or None on failure.
    Requires GOOGLE_PUBSUB_PROJECT_ID to be configured.
    """
    if not settings.GOOGLE_PUBSUB_PROJECT_ID:
        return None

    access_token = account.get("access_token")
    if not access_token:
        return None

    topic_name = f"projects/{settings.GOOGLE_PUBSUB_PROJECT_ID}/topics/{settings.GOOGLE_PUBSUB_TOPIC_ID}"
    payload = {
        "topicName": topic_name,
        "labelIds": ["INBOX", "SPAM"],
        "labelFilterBehavior": "INCLUDE",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                GMAIL_WATCH_URL,
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                json=payload,
            )
        if resp.status_code == 200:
            data = resp.json()
            logger.info(f"[monitor] Gmail Watch registered for user {user_id}: expiry={data.get('expiration')}")
            return data
        if resp.status_code == 401:
            # Try token refresh
            new_token = await refresh_access_token(user_id, account)
            if new_token:
                return await start_gmail_watch(user_id, account)
        logger.warning(f"[monitor] Gmail Watch registration failed for user {user_id}: {resp.status_code} {resp.text[:300]}")
    except Exception as e:
        logger.warning(f"[monitor] Gmail Watch error for user {user_id}: {e}")
    return None


async def stop_gmail_watch(user_id: str, account: Dict[str, Any]) -> bool:
    """Call Gmail users.stop() to cancel the watch subscription."""
    access_token = account.get("access_token")
    if not access_token:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                GMAIL_STOP_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code in (200, 204):
            logger.info(f"[monitor] Gmail Watch stopped for user {user_id}")
            return True
        logger.debug(f"[monitor] Gmail Watch stop response {resp.status_code} for user {user_id}")
        return False
    except Exception as e:
        logger.debug(f"[monitor] Gmail Watch stop error for user {user_id}: {e}")
        return False


# ---------------------------------------------------------------------------
# Pub/Sub notification handler
# ---------------------------------------------------------------------------

async def process_pubsub_notification(encoded_data: str, user_id_hint: Optional[str] = None) -> None:
    """
    Decode a Pub/Sub push notification from Gmail and process new messages.
    The Pub/Sub message data is base64-encoded JSON: {"emailAddress": "...", "historyId": "..."}
    """
    try:
        decoded = base64.urlsafe_b64decode(encoded_data + "==").decode("utf-8")
        notification = json.loads(decoded)
    except Exception as e:
        logger.warning(f"[monitor] Failed to decode Pub/Sub data: {e}")
        return

    email_address = notification.get("emailAddress", "")
    history_id = str(notification.get("historyId", ""))
    logger.info(f"[monitor] Pub/Sub notification: email={email_address} historyId={history_id}")

    # Find the matching user account
    user_id = None
    account = None
    for uid, acc in db.store["gmail_accounts"].items():
        if acc.get("email_address", "").lower() == email_address.lower() and acc.get("monitoring_active"):
            user_id = uid
            account = acc
            break

    if not user_id or not account:
        logger.debug(f"[monitor] No active monitoring account found for {email_address}")
        return

    await _fetch_and_process_history(user_id, account, history_id)


async def _fetch_and_process_history(
    user_id: str,
    account: Dict[str, Any],
    new_history_id: str,
) -> None:
    """
    Use Gmail History API to find messages added since last_history_id.
    Falls back to fetching recent messages if no history_id stored.
    """
    access_token = account.get("access_token")
    start_history_id = account.get("last_history_id")

    if not start_history_id:
        # First run — just process recent messages directly
        await _poll_recent_messages(user_id, account)
        _update_account_field(user_id, "last_history_id", new_history_id)
        return

    message_ids_to_process = set()

    try:
        params = {
            "startHistoryId": start_history_id,
            "historyTypes": "messageAdded",
            "labelId": "INBOX",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                GMAIL_HISTORY_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                params=params,
            )
        if resp.status_code == 401:
            new_token = await refresh_access_token(user_id, account)
            if new_token:
                access_token = new_token
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.get(
                        GMAIL_HISTORY_URL,
                        headers={"Authorization": f"Bearer {access_token}"},
                        params=params,
                    )

        if resp.status_code == 200:
            history_data = resp.json()
            for history_item in history_data.get("history", []):
                for msg_added in history_item.get("messagesAdded", []):
                    mid = msg_added.get("message", {}).get("id")
                    if mid:
                        message_ids_to_process.add(mid)

        # Also check spam labels
        params["labelId"] = "SPAM"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp2 = await client.get(
                GMAIL_HISTORY_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                params=params,
            )
        if resp2.status_code == 200:
            history_data2 = resp2.json()
            for history_item in history_data2.get("history", []):
                for msg_added in history_item.get("messagesAdded", []):
                    mid = msg_added.get("message", {}).get("id")
                    if mid:
                        message_ids_to_process.add(mid)

    except Exception as e:
        logger.warning(f"[monitor] History API error for user {user_id}: {e}")
        # Fall back to polling on history error
        await _poll_recent_messages(user_id, account)
        _update_account_field(user_id, "last_history_id", new_history_id)
        return

    # Process discovered messages
    for message_id in message_ids_to_process:
        asyncio.create_task(
            _process_single_message(user_id, account, message_id, account.get("access_token", ""))
        )

    # Advance the stored history ID
    _update_account_field(user_id, "last_history_id", new_history_id)


# ---------------------------------------------------------------------------
# Fallback polling
# ---------------------------------------------------------------------------

async def _poll_recent_messages(user_id: str, account: Dict[str, Any]) -> None:
    """
    Poll Gmail for the latest UNREAD messages from Inbox and Spam separately.
    Fetches:  2 unread from Inbox  +  2 unread from Spam  (max 4 per cycle).
    Skips any message that has already been processed (duplicate guard).
    Used as fallback when Pub/Sub is not configured, or on first watch setup.
    """
    access_token = account.get("access_token")
    if not access_token:
        return

    async def _fetch_unread(token: str, folder: str, limit: int = 2) -> List[Dict]:
        """Fetch up to `limit` unread messages from the given folder label."""
        query = f"is:unread in:{folder}"
        params = {"maxResults": limit, "q": query}
        headers = {"Authorization": f"Bearer {token}"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(GMAIL_MESSAGES_URL, headers=headers, params=params)
            if resp.status_code == 200:
                return resp.json().get("messages", [])
            if resp.status_code == 401:
                return []   # caller will refresh token
            logger.warning(f"[monitor] Gmail fetch ({folder}) returned {resp.status_code} for user {user_id}")
        except Exception as exc:
            logger.warning(f"[monitor] Gmail fetch ({folder}) error for user {user_id}: {exc}")
        return []

    # First attempt with current token
    inbox_msgs = await _fetch_unread(access_token, "inbox", limit=2)
    spam_msgs  = await _fetch_unread(access_token, "spam",  limit=2)

    # If both empty and token might be stale, try a refresh once
    if not inbox_msgs and not spam_msgs:
        new_token = await refresh_access_token(user_id, account)
        if new_token:
            access_token = new_token
            inbox_msgs = await _fetch_unread(access_token, "inbox", limit=2)
            spam_msgs  = await _fetch_unread(access_token, "spam",  limit=2)

    all_msgs = inbox_msgs + spam_msgs
    new_count = 0
    seen_ids: set = set()

    for msg_meta in all_msgs:
        m_id = msg_meta.get("id")
        if not m_id or m_id in seen_ids:
            continue
        seen_ids.add(m_id)
        if is_message_processed(m_id, user_id):
            continue
        new_count += 1
        # Fire-and-forget so the poll loop doesn't block on analysis
        asyncio.create_task(
            _process_single_message(user_id, account, m_id, access_token)
        )

    if new_count:
        logger.info(
            f"[monitor] Poll found {new_count} new unread message(s) for user {user_id} "
            f"(inbox={len(inbox_msgs)} spam={len(spam_msgs)})"
        )
    else:
        logger.debug(f"[monitor] Poll: no new unread messages for user {user_id}")


async def _polling_loop(user_id: str, interval_seconds: int) -> None:
    """Background polling loop for a single user. Runs until cancelled or disconnected."""
    logger.info(f"[monitor] Polling loop started for user {user_id} (interval={interval_seconds}s)")
    while True:
        try:
            account = db.store["gmail_accounts"].get(user_id)
            if not account or not account.get("monitoring_active") or not account.get("is_connected"):
                logger.info(f"[monitor] Polling loop stopping: monitoring_active=False or is_connected=False for user {user_id}")
                break
            await _poll_recent_messages(user_id, account)
        except asyncio.CancelledError:
            logger.info(f"[monitor] Polling loop cancelled for user {user_id}")
            raise
        except Exception as e:
            logger.warning(f"[monitor] Polling loop error for user {user_id}: {e}")
        await asyncio.sleep(interval_seconds)


# ---------------------------------------------------------------------------
# Public API: start / stop monitoring
# ---------------------------------------------------------------------------

async def start_monitoring(user_id: str, account: Dict[str, Any]) -> Dict[str, Any]:
    """
    Start automatic Gmail monitoring for a user.
    - Attempts to register Gmail Watch + Pub/Sub (production path)
    - Falls back to polling if Pub/Sub is not configured
    Returns a status dict.
    """
    # Mark as active first
    account["monitoring_active"] = True
    db.store["gmail_accounts"][user_id] = account

    mode = "polling"
    watch_expiry = None
    history_id = account.get("last_history_id")

    # Try Gmail Watch (Pub/Sub)
    if settings.GOOGLE_PUBSUB_PROJECT_ID:
        watch_result = await start_gmail_watch(user_id, account)
        if watch_result:
            raw_expiry = watch_result.get("expiration")
            if raw_expiry:
                # Gmail returns expiration in milliseconds since epoch
                try:
                    expiry_ms = int(raw_expiry)
                    watch_expiry = datetime.fromtimestamp(expiry_ms / 1000, tz=timezone.utc)
                    account["watch_expiry"] = watch_expiry.isoformat()
                except Exception:
                    pass
            history_id = str(watch_result.get("historyId", history_id or ""))
            account["last_history_id"] = history_id
            mode = "pubsub"
        else:
            logger.warning(f"[monitor] Gmail Watch failed for user {user_id}; falling back to polling.")
            mode = "polling"

    if mode == "polling":
        # Cancel any existing polling task for this user
        _cancel_polling_task(user_id)
        interval = settings.AUTO_MONITOR_POLL_INTERVAL_SECONDS
        task = asyncio.create_task(_polling_loop(user_id, interval))
        _polling_tasks[user_id] = task

    # Persist to Supabase
    _persist_monitoring_state(user_id, account, active=True, watch_expiry=watch_expiry, history_id=history_id)

    logger.info(f"[monitor] Monitoring STARTED for user {user_id} (mode={mode})")
    return {
        "monitoring_active": True,
        "mode": mode,
        "watch_expiry": watch_expiry.isoformat() if watch_expiry else None,
        "last_history_id": history_id,
        "poll_interval_seconds": settings.AUTO_MONITOR_POLL_INTERVAL_SECONDS if mode == "polling" else None,
    }


async def stop_monitoring(user_id: str) -> None:
    """
    Stop automatic Gmail monitoring for a user.
    Cancels polling task and calls Gmail Watch stop if applicable.
    """
    account = db.store["gmail_accounts"].get(user_id, {})

    # Stop polling task
    _cancel_polling_task(user_id)

    # Stop Gmail Watch if Pub/Sub was configured
    if settings.GOOGLE_PUBSUB_PROJECT_ID and account:
        await stop_gmail_watch(user_id, account)

    # Mark as inactive
    account["monitoring_active"] = False
    db.store["gmail_accounts"][user_id] = account

    _persist_monitoring_state(user_id, account, active=False)
    logger.info(f"[monitor] Monitoring STOPPED for user {user_id}")


def _cancel_polling_task(user_id: str) -> None:
    task = _polling_tasks.pop(user_id, None)
    if task and not task.done():
        task.cancel()


def _persist_monitoring_state(
    user_id: str,
    account: Dict[str, Any],
    active: bool,
    watch_expiry: Optional[datetime] = None,
    history_id: Optional[str] = None,
) -> None:
    """Persist monitoring state to Supabase gmail_accounts table."""
    admin_client = db.get_admin_client()
    if not admin_client:
        return
    update_payload: Dict[str, Any] = {
        "monitoring_active": active,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if watch_expiry:
        update_payload["watch_expiry"] = watch_expiry.isoformat()
    if history_id:
        update_payload["last_history_id"] = history_id
    try:
        admin_client.table("gmail_accounts") \
            .update(update_payload) \
            .eq("user_id", user_id) \
            .execute()
    except Exception as e:
        logger.debug(f"[monitor] Supabase monitoring state persist notice: {e}")


# ---------------------------------------------------------------------------
# Watch renewal (called periodically from main.py lifespan)
# ---------------------------------------------------------------------------

async def renew_expiring_watches() -> None:
    """
    Renew Gmail Watch subscriptions that are within 24 hours of expiry.
    Gmail Watch expires every 7 days; this keeps them alive.
    Should be called periodically (e.g., every 6 hours).
    """
    if not settings.GOOGLE_PUBSUB_PROJECT_ID:
        return

    now = datetime.now(timezone.utc)
    for user_id, account in list(db.store["gmail_accounts"].items()):
        if not account.get("monitoring_active"):
            continue
        watch_expiry_raw = account.get("watch_expiry")
        if not watch_expiry_raw:
            continue
        try:
            if isinstance(watch_expiry_raw, str):
                watch_expiry = datetime.fromisoformat(watch_expiry_raw.replace("Z", "+00:00"))
            else:
                watch_expiry = watch_expiry_raw
            hours_remaining = (watch_expiry - now).total_seconds() / 3600
            if hours_remaining < 24:
                logger.info(f"[monitor] Renewing Gmail Watch for user {user_id} (expires in {hours_remaining:.1f}h)")
                watch_result = await start_gmail_watch(user_id, account)
                if watch_result:
                    raw_expiry = watch_result.get("expiration")
                    if raw_expiry:
                        new_expiry = datetime.fromtimestamp(int(raw_expiry) / 1000, tz=timezone.utc)
                        account["watch_expiry"] = new_expiry.isoformat()
                        _persist_monitoring_state(user_id, account, active=True, watch_expiry=new_expiry)
        except Exception as e:
            logger.warning(f"[monitor] Watch renewal error for user {user_id}: {e}")


async def watch_renewal_loop() -> None:
    """Runs every 6 hours to renew expiring Gmail Watch subscriptions."""
    while True:
        try:
            await asyncio.sleep(6 * 3600)
            await renew_expiring_watches()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning(f"[monitor] Watch renewal loop error: {e}")


# ---------------------------------------------------------------------------
# Startup: restore monitoring for users who had it active before restart
# ---------------------------------------------------------------------------

async def restore_monitoring_on_startup() -> None:
    """
    Called during FastAPI lifespan startup.
    Restores monitoring for users who had monitoring_active=True in Supabase.
    """
    admin_client = db.get_admin_client()
    if not admin_client:
        return
    try:
        res = admin_client.table("gmail_accounts") \
            .select("*") \
            .eq("monitoring_active", True) \
            .eq("is_connected", True) \
            .execute()
        if not res.data:
            return
        for row in res.data:
            user_id = row.get("user_id")
            if not user_id:
                continue
            account = {
                "email_address": row.get("email_address", ""),
                "access_token": row.get("access_token", ""),
                "refresh_token": row.get("refresh_token"),
                "is_connected": row.get("is_connected", False),
                "auto_scan_enabled": row.get("auto_scan_enabled", False),
                "monitoring_active": True,
                "scan_limit": row.get("scan_limit", 10),
                "last_history_id": row.get("last_history_id"),
                "watch_expiry": row.get("watch_expiry"),
                "emails_auto_processed": row.get("emails_auto_processed", 0),
                "warnings_sent": row.get("warnings_sent", 0),
                "last_synced_at": row.get("last_synced_at"),
            }
            db.store["gmail_accounts"][user_id] = account
            logger.info(f"[monitor] Restoring monitoring for user {user_id} ({account['email_address']})")
            # Re-start polling (or watch renewal will handle Pub/Sub)
            if not settings.GOOGLE_PUBSUB_PROJECT_ID:
                _cancel_polling_task(user_id)
                interval = settings.AUTO_MONITOR_POLL_INTERVAL_SECONDS
                task = asyncio.create_task(_polling_loop(user_id, interval))
                _polling_tasks[user_id] = task
    except Exception as e:
        logger.warning(f"[monitor] Startup restore error: {e}")


def get_monitoring_status(user_id: str) -> Dict[str, Any]:
    """Return a monitoring status dict for a user (used by /monitor/status endpoint)."""
    account = db.store["gmail_accounts"].get(user_id, {})
    active = account.get("monitoring_active", False)
    pubsub_configured = bool(settings.GOOGLE_PUBSUB_PROJECT_ID)

    if not active:
        mode = "disabled"
    elif pubsub_configured:
        mode = "pubsub"
    else:
        mode = "polling"

    watch_expiry_raw = account.get("watch_expiry")
    watch_expiry = None
    if watch_expiry_raw and isinstance(watch_expiry_raw, str):
        try:
            watch_expiry = watch_expiry_raw
        except Exception:
            pass

    return {
        "monitoring_active": active,
        "mode": mode,
        "email_address": account.get("email_address"),
        "watch_expiry": watch_expiry,
        "last_history_id": account.get("last_history_id"),
        "emails_auto_processed": account.get("emails_auto_processed", 0),
        "warnings_sent": account.get("warnings_sent", 0),
        "last_event_time": account.get("last_event_time"),
        "poll_interval_seconds": settings.AUTO_MONITOR_POLL_INTERVAL_SECONDS if mode == "polling" else None,
    }
