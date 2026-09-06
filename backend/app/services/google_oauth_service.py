import urllib.parse
import httpx
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("vaultshield.oauth")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

class GoogleOAuthService:
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        self.scopes = " ".join(settings.GMAIL_SCOPES)

    def get_authorization_url(self, state: str) -> str:
        """Generate Google OAuth 2.0 consent URL requesting offline access with refresh token."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": self.scopes,
            "access_type": "offline",
            "prompt": "consent",
            "include_granted_scopes": "true",
            "state": state
        }
        return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens."""
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(GOOGLE_TOKEN_URL, data=data)
            if resp.status_code != 200:
                logger.error(f"Google OAuth token exchange failed with HTTP status {resp.status_code}")
                raise ValueError(f"Failed to exchange authorization code: HTTP {resp.status_code}")
            return resp.json()

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Exchange stored Google refresh token for a fresh access token via Google OAuth token endpoint.
        Returns dict containing: access_token, expires_in, scope, token_type.
        Raises ValueError with safe error description if refresh fails.
        """
        if not refresh_token:
            raise ValueError("No refresh token provided for token refresh.")
        if not self.client_id or not self.client_secret:
            raise ValueError("Google OAuth client credentials are not configured.")

        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(GOOGLE_TOKEN_URL, data=data)
            if resp.status_code != 200:
                error_type = "unknown_error"
                try:
                    err_json = resp.json()
                    error_type = err_json.get("error", "unknown_error")
                except Exception:
                    pass
                logger.warning(f"[OAuth] Google token refresh failed. HTTP Status: {resp.status_code}, Error: {error_type}")
                raise ValueError(f"Google token refresh failed ({resp.status_code}): {error_type}")

            tokens = resp.json()
            return tokens

    async def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """Fetch Google profile info (email, name, picture) with access token."""
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(GOOGLE_USERINFO_URL, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            return {}

    async def revoke_token(self, token: str) -> bool:
        """Revoke a token (access or refresh) with Google's OAuth 2.0 revocation endpoint."""
        if not token:
            return False
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    "https://oauth2.googleapis.com/revoke",
                    params={"token": token},
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                if resp.status_code == 200:
                    logger.info("[OAuth] Successfully revoked token with Google authorization server.")
                    return True
                else:
                    logger.warning(f"[OAuth] Google token revocation returned HTTP {resp.status_code}")
                    return False
        except Exception as e:
            logger.warning(f"[OAuth] Failed to contact Google token revocation endpoint: {e}")
            return False

google_oauth_service = GoogleOAuthService()

