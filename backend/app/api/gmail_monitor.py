"""
Gmail Automatic Monitoring API Router
/api/gmail/monitor/*

Endpoints:
  POST /start       — start automatic monitoring for authenticated user
  POST /stop        — stop automatic monitoring
  GET  /status      — return detailed monitoring status
  POST /pubsub/push — receive Gmail Pub/Sub push notifications (no auth, token-validated)
"""

import asyncio
import logging
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status

from app.dependencies import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.gmail import GmailStatusResponse, MonitoringStatusResponse
from app.database import db
from app.api.gmail import _load_gmail_account_from_supabase
from app.services import monitoring_service
from app.config import settings

logger = logging.getLogger("vaultshield.api.gmail_monitor")
router = APIRouter(prefix="/gmail/monitor", tags=["Gmail Auto-Monitoring"])


# ---------------------------------------------------------------------------
# POST /api/gmail/monitor/start
# ---------------------------------------------------------------------------

@router.post("/start", response_model=MonitoringStatusResponse)
async def start_monitoring(
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Enable automatic Gmail monitoring for the authenticated user.
    Registers a Gmail Watch (Pub/Sub) if GCP is configured, otherwise starts
    a background polling loop.  Returns current monitoring status.
    """
    user_id = current_user.id

    # Load account from memory, falling back to Supabase
    account = db.store["gmail_accounts"].get(user_id)
    if not account or not account.get("is_connected"):
        account = _load_gmail_account_from_supabase(user_id)

    if not account or not account.get("is_connected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gmail account is not connected. Please connect Gmail first.",
        )

    if not account.get("access_token"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Gmail access token available. Please reconnect Gmail.",
        )

    try:
        result = await monitoring_service.start_monitoring(user_id, account)
        status_dict = monitoring_service.get_monitoring_status(user_id)
        return MonitoringStatusResponse(**status_dict)
    except Exception as e:
        logger.error(f"[api] start_monitoring error for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start Gmail monitoring: {str(e)}",
        )


# ---------------------------------------------------------------------------
# POST /api/gmail/monitor/stop
# ---------------------------------------------------------------------------

@router.post("/stop", response_model=MonitoringStatusResponse)
async def stop_monitoring(
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Disable automatic Gmail monitoring for the authenticated user.
    Cancels any polling task and unregisters Gmail Watch.
    """
    user_id = current_user.id
    try:
        await monitoring_service.stop_monitoring(user_id)
        return MonitoringStatusResponse(
            monitoring_active=False,
            mode="disabled",
            email_address=db.store["gmail_accounts"].get(user_id, {}).get("email_address"),
        )
    except Exception as e:
        logger.error(f"[api] stop_monitoring error for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop Gmail monitoring: {str(e)}",
        )


# ---------------------------------------------------------------------------
# GET /api/gmail/monitor/status
# ---------------------------------------------------------------------------

@router.get("/status", response_model=MonitoringStatusResponse)
async def get_monitoring_status(
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Return detailed automatic monitoring status including processed counts,
    watch expiry, last event time, and current mode.
    """
    user_id = current_user.id

    # Ensure account is in memory
    account = db.store["gmail_accounts"].get(user_id)
    if not account:
        _load_gmail_account_from_supabase(user_id)

    status_dict = monitoring_service.get_monitoring_status(user_id)
    return MonitoringStatusResponse(**status_dict)


# ---------------------------------------------------------------------------
# POST /api/gmail/monitor/pubsub/push   (NO authentication — public endpoint)
# ---------------------------------------------------------------------------

@router.post("/pubsub/push")
async def receive_pubsub_push(
    request: Request,
    background_tasks: BackgroundTasks,
    token: str = Query(default=""),
):
    """
    Receive Gmail Pub/Sub push notifications.

    This endpoint is PUBLIC (no user auth) because Google's Pub/Sub service
    calls it directly.  It is protected by a shared secret token passed as a
    query parameter (?token=...).

    Gmail sends a JSON body:
    {
      "message": {
        "data": "<base64-encoded JSON>",   // {"emailAddress": "...", "historyId": "..."}
        "messageId": "...",
        "publishTime": "..."
      },
      "subscription": "projects/.../subscriptions/..."
    }

    We return HTTP 200 immediately and process the notification as a background task.
    """
    # Validate push token if configured
    expected_token = settings.GOOGLE_PUBSUB_PUSH_TOKEN
    if expected_token and token != expected_token:
        logger.warning("[pubsub] Rejected Pub/Sub push with invalid token")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid push token.")

    try:
        body = await request.json()
    except Exception:
        # Silently accept malformed bodies (some Pub/Sub validation probes send empty bodies)
        return {"status": "ok"}

    message = body.get("message", {})
    encoded_data = message.get("data", "")

    if not encoded_data:
        logger.debug("[pubsub] Pub/Sub push with no data payload — ignoring.")
        return {"status": "ok"}

    logger.info(f"[pubsub] Received Pub/Sub push notification messageId={message.get('messageId')}")

    # Process asynchronously so we return 200 immediately (required by Pub/Sub)
    background_tasks.add_task(
        _handle_pubsub_notification_safe,
        encoded_data=encoded_data,
    )

    return {"status": "ok"}


async def _handle_pubsub_notification_safe(encoded_data: str) -> None:
    """Wrapper that catches all errors so Pub/Sub retries don't spiral out of control."""
    try:
        await monitoring_service.process_pubsub_notification(encoded_data)
    except Exception as e:
        logger.error(f"[pubsub] Error handling notification: {e}", exc_info=True)
