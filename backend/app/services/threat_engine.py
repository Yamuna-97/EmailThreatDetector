import logging
from typing import Dict, Any, List, Tuple
from app.config import settings
from app.schemas.threat import ThreatAnalysisModel, ThreatIndicator

logger = logging.getLogger("vaultshield.threat_engine")

class ThreatEngine:
    def calculate_auth_risk_score(self, spf: str, dkim: str, dmarc: str) -> int:
        """Calculate score based on SPF, DKIM, DMARC authentication."""
        auth_score = 0
        if spf == "fail":
            auth_score += 40
        elif spf in ["softfail", "neutral"]:
            auth_score += 20

        if dkim == "fail":
            auth_score += 30
        elif dkim in ["none", "neutral"]:
            auth_score += 10

        if dmarc == "fail":
            auth_score += 40
        elif dmarc in ["none"]:
            auth_score += 15

        return min(auth_score, 100)

    def calculate_url_risk_score(self, urls: List[Dict[str, Any]]) -> int:
        """Calculate score based on extracted URLs and flags."""
        if not urls:
            return 0
        
        max_url_score = 0
        for u in urls:
            flags = u.get("risk_flags", [])
            u_score = len(flags) * 30
            if u.get("is_ip_based"):
                u_score += 35
            if u.get("is_shortener"):
                u_score += 25
            if u.get("is_punycode"):
                u_score += 40
            if u_score > max_url_score:
                max_url_score = u_score
        
        return min(max_url_score, 100)

    def compute_final_risk(
        self,
        ai_risk_score: int,
        ml_risk_score: int,
        ip_fraud_score: int,
        spf: str,
        dkim: str,
        dmarc: str,
        urls: List[Dict[str, Any]]
    ) -> Tuple[int, str]:
        """
        Compute weighted composite risk score (0-100) and severity category.
        Includes Logistic Regression ML model prediction alongside AI & threat intelligence.
        """
        auth_score = self.calculate_auth_risk_score(spf, dkim, dmarc)
        url_score = self.calculate_url_risk_score(urls)

        # Weighted composite calculation
        final_score = int(
            (ml_risk_score * getattr(settings, "WEIGHT_ML", 0.25)) +
            (ai_risk_score * settings.WEIGHT_AI) +
            (ip_fraud_score * settings.WEIGHT_IP_REPUTATION) +
            (auth_score * settings.WEIGHT_AUTH_RESULTS) +
            (url_score * settings.WEIGHT_URL_RISK)
        )

        final_score = max(0, min(100, final_score))

        logger.info(f"Final combined risk score: {final_score}")

        if final_score >= 75:
            severity = "critical"
        elif final_score >= 50:
            severity = "high"
        elif final_score >= 25:
            severity = "medium"
        else:
            severity = "low"

        return final_score, severity

threat_engine = ThreatEngine()
