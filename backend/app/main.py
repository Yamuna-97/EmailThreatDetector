import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import db
from app.api import (
    auth,
    gmail,
    emails,
    threats,
    investigators,
    geolocation,
    analytics,
    reports,
    demo,
    rag
)
from app.api import gmail_monitor
from app.services import monitoring_service
from app.services.rag_service import rag_service

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("vaultshield.main")

# Background tasks that run for the lifetime of the app
_background_tasks = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    db.initialize()

    # Restore automatic monitoring for users who had it active before restart
    await monitoring_service.restore_monitoring_on_startup()

    # Start Gmail Watch renewal loop (renews expiring watches every 6 hours)
    renewal_task = asyncio.create_task(monitoring_service.watch_renewal_loop())
    _background_tasks.append(renewal_task)

    # Initialize Dual RAG knowledge bases in background
    rag_init_task = asyncio.create_task(rag_service.initialize())
    _background_tasks.append(rag_init_task)

    yield

    # Graceful shutdown
    logger.info("Shutting down VaultShield Security Engine.")
    for task in _background_tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SIH 2026 AI-Powered Email Threat Detection, Geolocation and Forensic Intelligence Engine",
    lifespan=lifespan
)

# Configure CORS Middleware for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all local origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(gmail.router, prefix="/api")
app.include_router(gmail_monitor.router, prefix="/api")
app.include_router(emails.router, prefix="/api")
app.include_router(threats.router, prefix="/api")
app.include_router(investigators.router, prefix="/api")
app.include_router(geolocation.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(rag.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "healthcheck": "/api/health"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint checking external connections."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "supabase_connected": db.is_connected,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "ipqs_configured": bool(settings.IPQS_API_KEY),
        "google_oauth_configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
        "auto_monitoring_pubsub_mode": bool(settings.GOOGLE_PUBSUB_PROJECT_ID),
        "auto_monitoring_poll_interval_s": settings.AUTO_MONITOR_POLL_INTERVAL_SECONDS,
    }
