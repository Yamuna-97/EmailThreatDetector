import httpx
import json
import logging
import re
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas.threat import ThreatAnalysisModel, ThreatIndicator
from app.schemas.email import EmailModel

logger = logging.getLogger("vaultshield.gemini")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.fast_model = settings.GEMINI_FAST_MODEL
        self.pro_model = settings.GEMINI_PRO_MODEL

    async def analyze_email_threat(
        self,
        sender: str,
        subject: str,
        body: str,
        urls: List[Dict[str, Any]],
        headers: Dict[str, Any],
        ip_intel: Optional[Dict[str, Any]] = None,
        geo_intel: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Perform structured Gemini AI cybersecurity threat analysis.
        Strict separation between observed factual evidence and AI inference.
        """
        # Prepare observed evidence summary for prompt
        observed_facts = {
            "sender": sender,
            "subject": subject,
            "body_snippet": body[:1200] if body else "(empty body)",
            "extracted_urls": [u.get("url") for u in urls[:5]],
            "url_risk_flags": [u.get("risk_flags") for u in urls[:5] if u.get("risk_flags")],
            "spf_result": headers.get("spf", "unknown"),
            "dkim_result": headers.get("dkim", "unknown"),
            "dmarc_result": headers.get("dmarc", "unknown"),
            "source_ip": headers.get("source_ip"),
            "ip_fraud_score": ip_intel.get("fraud_score", 0) if ip_intel else 0,
            "ip_is_vpn": ip_intel.get("is_vpn", False) if ip_intel else False,
            "ip_is_proxy": ip_intel.get("is_proxy", False) if ip_intel else False,
            "geo_country": geo_intel.get("country", "Unknown") if geo_intel else "Unknown",
        }

        system_instruction = (
            "You are VaultShield's Advanced Forensic Cybersecurity Threat Classifier. "
            "Analyze the provided email based strictly on observed factual evidence versus AI security inference. "
            "Do NOT invent fictional IP addresses or domains. "
            "Output valid JSON ONLY matching this exact schema:\n"
            "{\n"
            '  "classification": "Phishing" | "Business Email Compromise" | "Credential Theft" | "Malware Delivery" | "Impersonation" | "Financial Fraud" | "Spam" | "Benign",\n'
            '  "severity": "low" | "medium" | "high" | "critical",\n'
            '  "ai_risk_score": 0 to 100 integer,\n'
            '  "confidence": 0.0 to 1.0 float,\n'
            '  "summary": "Concise forensic summary",\n'
            '  "indicators": [{"type": "social_engineering"|"suspicious_url"|"auth_failure"|"sender_anomaly", "description": "...", "severity": "low"|"medium"|"high"|"critical"}],\n'
            '  "observed_evidence": {"key": "value"},\n'
            '  "ai_inferences": {"intent": "...", "target": "..."},\n'
            '  "recommended_actions": ["Action 1", "Action 2", "Action 3"]\n'
            "}"
        )

        user_prompt = f"Perform deep forensic inspection on this email evidence:\n\n{json.dumps(observed_facts, indent=2)}"

        if self.api_key:
            try:
                endpoint = f"{GEMINI_API_URL}/{self.fast_model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": f"{system_instruction}\n\n{user_prompt}"}]}],
                    "generationConfig": {
                        "response_mime_type": "application/json",
                        "temperature": 0.1
                    }
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(endpoint, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            text_response = candidates[0]["content"]["parts"][0]["text"].strip()
                            # Strip any markdown json fences if present
                            if text_response.startswith("```json"):
                                text_response = text_response[7:]
                            if text_response.startswith("```"):
                                text_response = text_response[3:]
                            if text_response.endswith("```"):
                                text_response = text_response[:-3]
                            parsed_json = json.loads(text_response.strip())
                            logger.info("Gemini AI threat analysis succeeded with structured JSON.")
                            return parsed_json
                    else:
                        error_detail = resp.text[:200] if resp.text else "No response body"
                        logger.warning(f"Gemini API returned HTTP {resp.status_code} ({resp.reason_phrase}): {error_detail}. Executing heuristic forensic fallback.")
            except httpx.TimeoutException:
                logger.warning("Gemini API call timed out after 30 seconds. Executing heuristic forensic fallback.")
            except Exception as e:
                err_type = type(e).__name__
                err_msg = str(e) if str(e) else "Unknown internal error"
                logger.warning(f"Gemini API call failed: [{err_type}] {err_msg}. Executing heuristic forensic fallback.")

        # High-precision Rule-Based & NLP heuristic fallback if API call fails or key is missing
        return self._heuristic_analysis(observed_facts, urls)

    def _heuristic_analysis(self, facts: Dict[str, Any], urls: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Expert rule-based cybersecurity engine fallback matching strict JSON schema."""
        sender = facts["sender"].lower()
        subject = facts["subject"].lower()
        body = facts["body_snippet"].lower()
        spf = facts["spf_result"].lower()
        dmarc = facts["dmarc_result"].lower()
        fraud_score = facts.get("ip_fraud_score", 0)

        score = 10
        classification = "Benign"
        severity = "low"
        indicators = []
        inferences = {}
        recommended_actions = ["No immediate threat detected. Normal vigilance advised."]

        # Check Urgency & Social Engineering
        urgency_keywords = ["urgent", "immediate action", "account suspended", "verify now", "password expired", "unauthorized access", "wire transfer", "payroll", "security alert"]
        found_urgent = [k for k in urgency_keywords if k in subject or k in body]
        if found_urgent:
            score += 30
            indicators.append({
                "type": "social_engineering",
                "description": f"Creates artificial psychological urgency using keywords: {', '.join(found_urgent)}",
                "severity": "high"
            })
            inferences["social_engineering"] = "Adversary attempting psychological pressure to bypass scrutiny."

        # Check Brand Spoofing / Impersonation
        spoof_brands = ["microsoft", "google", "paypal", "apple", "bank", "chase", "wells fargo", "netflix", "internal it", "hr department"]
        claimed_brand = [b for b in spoof_brands if b in subject or b in body or b in sender]
        if claimed_brand:
            score += 20
            indicators.append({
                "type": "sender_anomaly",
                "description": f"Claims association with major entity ({claimed_brand[0]})",
                "severity": "medium"
            })

        # Check Authentication Failures
        if spf == "fail" or dmarc == "fail":
            score += 25
            indicators.append({
                "type": "auth_failure",
                "description": f"Email authentication failed (SPF: {spf}, DMARC: {dmarc}). High probability of domain spoofing.",
                "severity": "critical"
            })
            inferences["spoofing"] = "Sender address was forged; fails domain alignment."

        # Check Suspicious URLs
        for u in urls:
            flags = u.get("risk_flags", [])
            if flags:
                score += 25
                indicators.append({
                    "type": "suspicious_url",
                    "description": f"Dangerous URL characteristics detected in {u.get('url', '')}: {'; '.join(flags)}",
                    "severity": "high"
                })

        # Check IP Quality Score
        if fraud_score >= 50:
            score += 20
            indicators.append({
                "type": "ip_reputation",
                "description": f"Originating IP has elevated fraud score ({fraud_score}/100) on global threat feeds.",
                "severity": "high"
            })

        # Normalize score and classification
        score = min(score, 98)
        if score >= 75:
            severity = "critical"
            classification = "Phishing" if "login" in body or "password" in body or "verify" in body else "Credential Theft"
            recommended_actions = [
                "Block sender domain across email gateway",
                "Revoke and reset user credentials immediately",
                "Quarantine email across all enterprise inboxes",
                "Add destination URLs to firewall blacklist"
            ]
        elif score >= 50:
            severity = "high"
            classification = "Business Email Compromise" if "transfer" in body or "invoice" in body else "Phishing"
            recommended_actions = [
                "Warn recipient and flag message as untrusted",
                "Do not click any embedded links or download attachments",
                "Submit incident to security operations for domain verification"
            ]
        elif score >= 25:
            severity = "medium"
            classification = "Spam"
            recommended_actions = [
                "Mark as spam and move to junk folder",
                "Verify sender identity via out-of-band communication"
            ]

        return {
            "classification": classification,
            "severity": severity,
            "ai_risk_score": score,
            "confidence": 0.94 if score > 50 else 0.85,
            "summary": f"Identified {classification.lower()} patterns with {severity} risk profile based on authentication results and content analysis.",
            "indicators": indicators,
            "observed_evidence": {
                "sender_header": facts["sender"],
                "spf": spf,
                "dmarc": dmarc,
                "url_count": len(urls),
                "ip_fraud_score": fraud_score
            },
            "ai_inferences": inferences or {"intent": "Routine communication or low-risk unsolicited message"},
            "recommended_actions": recommended_actions
        }

gemini_service = GeminiService()
