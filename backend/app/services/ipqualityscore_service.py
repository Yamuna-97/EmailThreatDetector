import httpx
import logging
from typing import Optional, Dict, Any
from app.config import settings
from app.schemas.geolocation import IPIntelligenceModel
from app.utils.ip_utils import is_valid_ip, is_private_ip
from app.database import db

logger = logging.getLogger("vaultshield.ipqs")

class IPQualityScoreService:
    def __init__(self):
        self.api_key = settings.IPQS_API_KEY
        self.base_url = "https://ipqualityscore.com/api/json/ip"

    async def get_ip_intelligence(self, ip: str) -> IPIntelligenceModel:
        """Fetch IP reputation, fraud score, proxy/VPN/TOR detection with caching."""
        if not is_valid_ip(ip):
            return IPIntelligenceModel(ip=ip, is_private=False, fraud_score=0)
        
        if is_private_ip(ip):
            return IPIntelligenceModel(
                ip=ip,
                is_private=True,
                fraud_score=0,
                isp="Internal Private Network / Relay",
                country_name="Internal LAN"
            )

        # Check in-memory cache
        if ip in db.store["ip_intelligence"]:
            return db.store["ip_intelligence"][ip]

        # Call IPQS API if key is configured
        if self.api_key:
            try:
                url = f"{self.base_url}/{self.api_key}/{ip}?strictness=1&allow_public_access_points=true"
                async with httpx.AsyncClient(timeout=6.0) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("success", False):
                            intel = IPIntelligenceModel(
                                ip=ip,
                                is_private=False,
                                fraud_score=int(data.get("fraud_score", 0)),
                                is_vpn=bool(data.get("vpn", False)),
                                is_proxy=bool(data.get("proxy", False)),
                                is_tor=bool(data.get("tor", False)),
                                is_bot=bool(data.get("bot_status", False)),
                                isp=data.get("ISP"),
                                asn=str(data.get("ASN", "")),
                                organization=data.get("organization"),
                                country_code=data.get("country_code"),
                                country_name=data.get("country_code"),
                                city=data.get("city")
                            )
                            db.store["ip_intelligence"][ip] = intel
                            return intel
            except Exception as e:
                logger.warning(f"IPQS API query failed for {ip}: {e}. Falling back to baseline.")

        # Baseline heuristic fallback for public IP when no key or during offline demo
        baseline_score = 15
        intel = IPIntelligenceModel(
            ip=ip,
            is_private=False,
            fraud_score=baseline_score,
            is_vpn=False,
            is_proxy=False,
            is_tor=False,
            isp="External Autonomous System",
            country_name="Identified External IP"
        )
        db.store["ip_intelligence"][ip] = intel
        return intel

ipqs_service = IPQualityScoreService()
