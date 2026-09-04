import logging
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.dependencies import require_investigator
from app.schemas.auth import UserResponse
from app.services.report_service import report_service
from app.database import db

logger = logging.getLogger("vaultshield.api.reports")
router = APIRouter(prefix="/investigator/reports", tags=["Investigator Reports"])

@router.get("/generate/{threat_id}")
async def generate_threat_report_pdf(
    threat_id: str,
    investigator: UserResponse = Depends(require_investigator)
):
    """Generate and stream a professional PDF forensic investigation report."""
    threat = db.store["threats"].get(threat_id)
    if not threat:
        raise HTTPException(status_code=404, detail="Threat incident not found")

    email = db.store["emails"].get(threat.email_id) if threat.email_id else None
    analysis = threat.analysis
    
    source_ip = "198.51.100.25"
    if email and email.headers and email.headers.source_ip:
        source_ip = email.headers.source_ip

    ip_intel = db.store["ip_intelligence"].get(source_ip)
    geo = db.store["geolocations"].get(source_ip)

    threat_payload = {
        "threat": threat.model_dump() if hasattr(threat, "model_dump") else threat,
        "email": email.model_dump() if email and hasattr(email, "model_dump") else (email or {}),
        "analysis": analysis.model_dump() if analysis and hasattr(analysis, "model_dump") else (analysis or {}),
        "ip_intelligence": ip_intel.model_dump() if ip_intel and hasattr(ip_intel, "model_dump") else (ip_intel or {}),
        "geolocation": geo.model_dump() if geo and hasattr(geo, "model_dump") else (geo or {})
    }

    try:
        pdf_bytes = report_service.generate_threat_pdf(threat_payload, investigator_name=investigator.name)
        
        # Save record of report
        report_id = str(uuid.uuid4())
        db.store["reports"][report_id] = {
            "id": report_id,
            "threat_id": threat_id,
            "generated_by": investigator.id,
            "report_title": f"Forensic Dossier: {threat.threat_type} (Incident #{threat_id[:8]})",
            "created_at": datetime.now()
        }

        filename = f"VaultShield_Forensic_Report_{threat_id[:8]}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate forensic PDF: {str(e)}")

@router.get("")
async def list_generated_reports(investigator: UserResponse = Depends(require_investigator)):
    """List all generated forensic investigation reports."""
    return list(db.store["reports"].values())
