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
        """Generate Google OAuth 2.0 consent URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": self.scopes,
            "access_type": "offline",
            "prompt": "consent",
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
                logger.error(f"Google OAuth token exchange failed: {resp.text}")
                raise ValueError(f"Failed to exchange code: {resp.text}")
            return resp.json()

    async def get_user_email(self, access_token: str) -> str:
        """Fetch Google profile email with access token."""
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(GOOGLE_USERINFO_URL, headers=headers)
            if resp.status_code == 200:
                return resp.json().get("email", "")
            return ""

google_oauth_service = GoogleOAuthService()
