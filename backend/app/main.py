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
    """Application startup & shutdown lifecycle.

    CRITICAL: yield must happen IMMEDIATELY so Uvicorn workers are responsive
    to Render's port scanner and /api/health checks.

    Pattern:
        1. db.initialize()   — fast, synchronous, no network I/O
        2. Schedule background tasks with asyncio.create_task() — non-blocking
        3. yield             — PORT is open, /api/health returns 200 immediately
        4. (server runs)
        5. After yield       — graceful shutdown, cancel background tasks

    All expensive work (RAG PDF parsing, monitoring restore, watch renewal)
    runs as fire-and-forget coroutines that start AFTER the event loop yields
    to Uvicorn's connection handler. This prevents the Render 502.
    """
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")

    # Fast synchronous DB client initialization — no network I/O
    db.initialize()

    # ------------------------------------------------------------------
    # Schedule all background startup work as non-blocking tasks.
    # create_task() returns immediately; the coroutines run concurrently
    # with the HTTP server — they do NOT block the port from opening.
    # ------------------------------------------------------------------

    async def _safe_restore_monitoring():
        """Restore monitoring state; log schema errors without crashing."""
        try:
            # Small delay so Render health check can succeed first
            await asyncio.sleep(3)
            await monitoring_service.restore_monitoring_on_startup()
        except Exception as exc:
            logger.warning(f"[startup] Monitoring restore skipped (schema not migrated?): {exc}")

    restore_task = asyncio.create_task(_safe_restore_monitoring())
    _background_tasks.append(restore_task)

    renewal_task = asyncio.create_task(monitoring_service.watch_renewal_loop())
    _background_tasks.append(renewal_task)

    rag_init_task = asyncio.create_task(rag_service.initialize())
    _background_tasks.append(rag_init_task)

    logger.info("[startup] Background tasks scheduled.")
    logger.info("[startup] HTTP server ready — accepting connections.")

    # ------------------------------------------------------------------
    # yield — Uvicorn workers are now fully available.
    # Render port scanner will find the open port immediately.
    # /api/health returns HTTP 200 from this point forward.
    # ------------------------------------------------------------------
    yield

    # ------------------------------------------------------------------
    # Graceful shutdown — cancel all long-running background tasks
    # ------------------------------------------------------------------
    logger.info("Shutting down CyberTrace — cancelling background tasks.")
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
# Production: CORS_ORIGINS env var must be set to the Vercel frontend URL.
# Development: localhost origins are included automatically by settings.CORS_ORIGINS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
        "rag_ready": rag_service.is_initialized,
        "supabase_connected": db.is_connected,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "ipqs_configured": bool(settings.IPQS_API_KEY),
        "google_oauth_configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
        "auto_monitoring_pubsub_mode": bool(settings.GOOGLE_PUBSUB_PROJECT_ID),
        "auto_monitoring_poll_interval_s": settings.AUTO_MONITOR_POLL_INTERVAL_SECONDS,
    }
