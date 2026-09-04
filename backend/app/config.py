import os
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "VaultShield AI Threat Intelligence API"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://zgzxiytiaqtjzylckpbv.supabase.co")
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

    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_FAST_MODEL: str = os.getenv("GEMINI_FAST_MODEL", "gemini-2.5-flash")
    GEMINI_PRO_MODEL: str = os.getenv("GEMINI_PRO_MODEL", "gemini-2.5-pro")

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
    ALERT_RECIPIENT_EMAIL: str = os.getenv("ALERT_RECIPIENT_EMAIL", "")

    # Threat Scoring Weights
    WEIGHT_AI: float = 0.35
    WEIGHT_IP_REPUTATION: float = 0.25
    WEIGHT_AUTH_RESULTS: float = 0.20
    WEIGHT_URL_RISK: float = 0.20

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
