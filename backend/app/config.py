import os
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


def _parse_cors_origins(raw: str) -> List[str]:
    """Parse a comma-separated CORS_ORIGINS env var into a list of stripped origins."""
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "CyberTrace AI Threat Intelligence API"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # CORS_ORIGINS: comma-separated list of allowed origins.
    # In production (Render), set this env var to your Vercel frontend URL:
    #   CORS_ORIGINS=https://your-app.vercel.app
    # For local dev with multiple origins, separate by comma:
    #   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
    @property
    def CORS_ORIGINS(self) -> List[str]:  # type: ignore[override]
        raw = os.getenv("CORS_ORIGINS", "")
        if raw.strip():
            origins = _parse_cors_origins(raw)
        else:
            # Development fallback — never used on Render (CORS_ORIGINS must be set)
            origins = []
        # Always include FRONTEND_URL if set
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        # Always allow localhost for local development
        dev_origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
        ]
        for o in dev_origins:
            if o not in origins:
                origins.append(o)
        return origins

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_SECRET_KEY", ""))
    SUPABASE_JWKS_URL: str = os.getenv("SUPABASE_JWKS_URL", "")

    # Google OAuth 2.0 & Gmail
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/gmail/callback")
    GMAIL_SCOPES: List[str] = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ]

    # Gmail Automatic Monitoring — Pub/Sub push (production)
    # Leave GOOGLE_PUBSUB_PROJECT_ID empty to use fallback polling mode (local dev)
    GOOGLE_PUBSUB_PROJECT_ID: str = os.getenv("GOOGLE_PUBSUB_PROJECT_ID", "")
    GOOGLE_PUBSUB_TOPIC_ID: str = os.getenv("GOOGLE_PUBSUB_TOPIC_ID", "gmail-watch-topic")
    # Secret token sent as ?token= query param on push endpoint to validate legitimate Pub/Sub calls
    GOOGLE_PUBSUB_PUSH_TOKEN: str = os.getenv("GOOGLE_PUBSUB_PUSH_TOKEN", "")
    # Fallback polling interval in seconds (used when Pub/Sub not configured)
    AUTO_MONITOR_POLL_INTERVAL_SECONDS: int = int(os.getenv("AUTO_MONITOR_POLL_INTERVAL_SECONDS", "60"))

    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_FAST_MODEL: str = os.getenv("GEMINI_FAST_MODEL", "gemini-2.5-flash")
    GEMINI_PRO_MODEL: str = os.getenv("GEMINI_PRO_MODEL", "gemini-2.5-pro")
    GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2")

    # IPQualityScore
    IPQS_API_KEY: str = os.getenv("IPQS_API_KEY", "")

    # IP Geolocation
    IP_GEOLOCATION_API_KEY: str = os.getenv("IP_GEOLOCATION_API_KEY", "")
    IP_GEOLOCATION_BASE_URL: str = os.getenv("IP_GEOLOCATION_BASE_URL", "https://ipapi.co")

    # SMTP Email Alerting
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

    # Admin / Investigator access control
    # ADMIN_EMAIL: the primary admin account email (replaces hardcoded personal email)
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "")
    # ADMIN_INVESTIGATOR_EMAILS: comma-separated list of emails that get investigator role
    ADMIN_INVESTIGATOR_EMAILS: str = os.getenv("ADMIN_INVESTIGATOR_EMAILS", "")
    ALERT_RECIPIENT_EMAIL: str = os.getenv("ALERT_RECIPIENT_EMAIL", "")

    # Threat Scoring Weights
    WEIGHT_ML: float = 0.25
    WEIGHT_AI: float = 0.25
    WEIGHT_IP_REPUTATION: float = 0.20
    WEIGHT_AUTH_RESULTS: float = 0.15
    WEIGHT_URL_RISK: float = 0.15

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
