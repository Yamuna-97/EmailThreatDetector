import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.schemas.auth import UserResponse, MessageResponse
from app.services.demo_service import demo_service, DEMO_SCENARIOS
from app.database import db

logger = logging.getLogger("vaultshield.api.demo")
router = APIRouter(prefix="/demo", tags=["Demo Mode & SIH Scenarios"])

@router.post("/seed", response_model=MessageResponse)
async def seed_demo_incidents(current_user: UserResponse = Depends(get_current_user)):
    """
    Seed realistic enterprise synthetic threat scenarios (Chase Phishing, M365 MFA Spoof, HR Wire Fraud)
    for interactive SIH 2026 jury presentations.
    """
    results = await demo_service.seed_demo_data(user_id=current_user.id)
    return MessageResponse(
        message=f"Successfully seeded {len(results)} high-fidelity cybersecurity scenarios into active pipeline."
    )

@router.get("/scenarios")
async def get_raw_demo_scenarios():
    """Retrieve raw template scenarios for inspection."""
    return DEMO_SCENARIOS

@router.post("/reset", response_model=MessageResponse)
async def reset_demo_data(current_user: UserResponse = Depends(get_current_user)):
    """Clear demo threats and restart pipeline."""
    # Keep non-demo emails
    db.store["emails"] = {k: v for k, v in db.store["emails"].items() if not v.is_demo}
    db.store["threats"] = {k: v for k, v in db.store["threats"].items() if not v.is_demo}
    return MessageResponse(message="Demo pipeline reset successfully.")
