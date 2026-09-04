import httpx
import base64
import logging
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.email_parser import email_parser
from app.services.url_analyzer import url_analyzer
from app.services.ipqualityscore_service import ipqs_service
from app.services.geolocation_service import geolocation_service
from app.services.gemini_service import gemini_service
from app.services.threat_engine import threat_engine
from app.services.smtp_service import smtp_alert_service
from app.schemas.email import EmailModel, EmailUrlInfo
from app.schemas.threat import ThreatModel, ThreatAnalysisModel, ThreatIndicator, AlertModel
from app.database import db

logger = logging.getLogger("vaultshield.gmail")
GMAIL_MESSAGES_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages"

class GmailService:
    async def fetch_messages_list(self, access_token: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Fetch list of message IDs from user's Gmail inbox."""
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {"maxResults": max_results, "q": "in:inbox"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(GMAIL_MESSAGES_URL, headers=headers, params=params)
            if resp.status_code == 200:
                return resp.json().get("messages", [])
            logger.error(f"Gmail fetch failed: {resp.status_code} - {resp.text}")
            return []

    async def get_message_detail(self, access_token: str, message_id: str) -> Optional[Dict[str, Any]]:
        """Fetch full email details from Gmail API."""
        headers = {"Authorization": f"Bearer {access_token}"}
        url = f"{GMAIL_MESSAGES_URL}/{message_id}?format=full"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            return None

    def _extract_body_from_payload(self, payload: Dict[str, Any]) -> str:
        """Decode base64url encoded body from Gmail payload parts."""
        body = ""
        if "data" in payload.get("body", {}):
            encoded = payload["body"]["data"]
            try:
                body = base64.urlsafe_b64decode(encoded.encode("UTF-8")).decode("UTF-8", errors="ignore")
            except Exception:
                pass
        elif "parts" in payload:
            for part in payload["parts"]:
                mime_type = part.get("mimeType", "")
                if mime_type in ["text/plain", "text/html"] and "data" in part.get("body", {}):
                    encoded = part["body"]["data"]
                    try:
                        part_body = base64.urlsafe_b64decode(encoded.encode("UTF-8")).decode("UTF-8", errors="ignore")
                        body += part_body + "\n"
                    except Exception:
                        pass
        return body

    async def process_and_scan_email(
        self,
        user_id: str,
        message_id: str,
        thread_id: Optional[str],
        sender: str,
        recipient: str,
        subject: str,
        body: str,
        headers_data: Any,
        is_demo: bool = False
    ) -> Dict[str, Any]:
        """
        Complete Threat Processing Pipeline:
        1. Parse headers & authentication results (SPF, DKIM, DMARC, Source IP)
        2. Extract & analyze URLs
        3. Lookup IPQualityScore threat intel
        4. Lookup GeoLocation
        5. Run Gemini AI reasoning
        6. Compute composite Threat Engine score
        7. Store in database
        8. Generate Alert if high/critical
        """
        # Step 1: Parse headers
        header_info = email_parser.parse_raw_headers(headers_data)

        # Step 2: Extract & analyze URLs
        url_objects = url_analyzer.analyze_all(body)
        urls_dict = [u.model_dump() for u in url_objects]

        # Step 3: IP Intelligence
        source_ip = header_info.source_ip or "198.51.100.25"
        ip_intel = await ipqs_service.get_ip_intelligence(source_ip)

        # Step 4: GeoLocation
        geo_intel = await geolocation_service.get_geolocation(source_ip)

        # Step 5: Gemini AI Analysis
        gemini_result = await gemini_service.analyze_email_threat(
            sender=sender,
            subject=subject,
            body=body,
            urls=urls_dict,
            headers=header_info.model_dump(),
            ip_intel=ip_intel.model_dump(),
            geo_intel=geo_intel.model_dump(),
        )

        # Step 6: Risk Engine Composite Calculation
        final_risk_score, final_severity = threat_engine.compute_final_risk(
            ai_risk_score=gemini_result.get("ai_risk_score", 10),
            ip_fraud_score=ip_intel.fraud_score,
            spf=header_info.spf or "unknown",
            dkim=header_info.dkim or "unknown",
            dmarc=header_info.dmarc or "unknown",
            urls=urls_dict
        )

        email_uuid = str(uuid.uuid4())
        threat_uuid = str(uuid.uuid4())
        analysis_uuid = str(uuid.uuid4())

        # Email Model
        email_record = EmailModel(
            id=email_uuid,
            user_id=user_id,
            message_id=message_id,
            thread_id=thread_id,
            sender=sender,
            recipient=recipient,
            subject=subject,
            date=datetime.now(),
            snippet=body[:150] if body else "",
            plain_text_body=body,
            headers=header_info,
            urls=url_objects,
            is_demo=is_demo
        )

        # Threat Analysis Model
        indicators = [
            ThreatIndicator(**i) if isinstance(i, dict) else i
            for i in gemini_result.get("indicators", [])
        ]
        
        analysis_record = ThreatAnalysisModel(
            id=analysis_uuid,
            email_id=email_uuid,
            user_id=user_id,
            classification=gemini_result.get("classification", "Phishing"),
            severity=final_severity,
            ai_risk_score=gemini_result.get("ai_risk_score", 10),
            final_risk_score=final_risk_score,
            confidence=float(gemini_result.get("confidence", 0.95)),
            summary=gemini_result.get("summary", "Automated threat analysis completed."),
            indicators=indicators,
            observed_evidence=gemini_result.get("observed_evidence", {}),
            ai_inferences=gemini_result.get("ai_inferences", {}),
            recommended_actions=gemini_result.get("recommended_actions", []),
            created_at=datetime.now()
        )

        # Primary Threat Record
        threat_record = ThreatModel(
            id=threat_uuid,
            email_id=email_uuid,
            user_id=user_id,
            threat_type=gemini_result.get("classification", "Phishing"),
            severity=final_severity,
            risk_score=final_risk_score,
            confidence=float(gemini_result.get("confidence", 0.95)),
            summary=gemini_result.get("summary", ""),
            status="new",
            is_demo=is_demo,
            created_at=datetime.now(),
            analysis=analysis_record
        )

        # Save to local fast in-memory store
        db.store["emails"][email_uuid] = email_record
        db.store["threats"][threat_uuid] = threat_record

        # Generate alert if high or critical
        alert_record = None
        if final_severity in ["high", "critical"]:
            alert_uuid = str(uuid.uuid4())
            alert_record = AlertModel(
                id=alert_uuid,
                user_id=user_id,
                threat_id=threat_uuid,
                title=f"{final_severity.upper()} Threat: {gemini_result.get('classification', 'Phishing')}",
                message=f"Suspicious email from {sender}: {subject}",
                severity=final_severity,
                is_read=False,
                created_at=datetime.now()
            )
            db.store["alerts"][alert_uuid] = alert_record

        # Automated SMTP Email Warning Alert on CRITICAL threats
        if final_severity == "critical" or final_risk_score >= 75:
            await smtp_alert_service.send_critical_threat_alert_async(
                recipient_email=recipient,
                threat_data=threat_record.model_dump(),
                email_data=email_record.model_dump(),
                analysis_data=analysis_record.model_dump()
            )

        # Timeline Event
        event_uuid = str(uuid.uuid4())
        event_dict = {
            "id": event_uuid,
            "threat_id": threat_uuid,
            "event_type": "email_analyzed",
            "title": f"Threat Classified as {gemini_result.get('classification')}",
            "description": f"Computed Final Risk Score: {final_risk_score}/100 ({final_severity.upper()}). AI Confidence: {int(float(gemini_result.get('confidence', 0.95))*100)}%",
            "metadata": {
                "spf": header_info.spf,
                "dmarc": header_info.dmarc,
                "source_ip": source_ip,
                "urls_count": len(url_objects)
            },
            "timestamp": datetime.now().isoformat()
        }
        db.store["investigation_events"][event_uuid] = event_dict

        # Direct Persistence to Supabase PostgreSQL Tables using Admin Client
        admin_client = db.get_admin_client()
        if admin_client:
            try:
                # 1. Insert to public.emails
                admin_client.table("emails").insert({
                    "id": email_uuid,
                    "user_id": user_id,
                    "message_id": message_id,
                    "thread_id": thread_id,
                    "sender": sender,
                    "recipient": recipient,
                    "subject": subject,
                    "snippet": body[:150] if body else "",
                    "plain_text_body": body,
                    "is_demo": is_demo
                }).execute()
                logger.info(f"Successfully inserted email {email_uuid} into Supabase emails table.")
            except Exception as e:
                logger.warning(f"Supabase emails table insert error: {type(e).__name__} - {e}")

            try:
                # 2. Insert to public.email_headers
                admin_client.table("email_headers").insert({
                    "id": str(uuid.uuid4()),
                    "email_id": email_uuid,
                    "from_header": sender,
                    "to_header": recipient,
                    "reply_to": header_info.reply_to,
                    "return_path": header_info.return_path,
                    "spf": header_info.spf,
                    "dkim": header_info.dkim,
                    "dmarc": header_info.dmarc,
                    "source_ip": header_info.source_ip
                }).execute()
            except Exception as e:
                logger.debug(f"Supabase email_headers insert notice: {e}")

            try:
                # 3. Insert to public.threats
                admin_client.table("threats").insert({
                    "id": threat_uuid,
                    "email_id": email_uuid,
                    "user_id": user_id,
                    "threat_type": gemini_result.get("classification", "Phishing"),
                    "severity": final_severity,
                    "risk_score": final_risk_score,
                    "confidence": float(gemini_result.get("confidence", 0.95)),
                    "summary": gemini_result.get("summary", ""),
                    "status": "new",
                    "is_demo": is_demo
                }).execute()
                logger.info(f"Successfully inserted threat {threat_uuid} into Supabase threats table.")
            except Exception as e:
                logger.warning(f"Supabase threats table insert error: {type(e).__name__} - {e}")

            try:
                # 4. Insert to public.threat_analyses
                admin_client.table("threat_analyses").insert({
                    "id": analysis_uuid,
                    "email_id": email_uuid,
                    "user_id": user_id,
                    "classification": gemini_result.get("classification", "Phishing"),
                    "severity": final_severity,
                    "ai_risk_score": gemini_result.get("ai_risk_score", 10),
                    "final_risk_score": final_risk_score,
                    "confidence": float(gemini_result.get("confidence", 0.95)),
                    "summary": gemini_result.get("summary", ""),
                    "indicators": [i.model_dump() for i in indicators],
                    "observed_evidence": gemini_result.get("observed_evidence", {}),
                    "ai_inferences": gemini_result.get("ai_inferences", {}),
                    "recommended_actions": gemini_result.get("recommended_actions", [])
                }).execute()
                logger.info(f"Successfully inserted threat analysis {analysis_uuid} into Supabase threat_analyses table.")
            except Exception as e:
                logger.warning(f"Supabase threat_analyses table insert error: {type(e).__name__} - {e}")

            if alert_record:
                try:
                    admin_client.table("alerts").insert({
                        "id": alert_record.id,
                        "user_id": user_id,
                        "threat_id": threat_uuid,
                        "title": alert_record.title,
                        "message": alert_record.message,
                        "severity": final_severity,
                        "is_read": False
                    }).execute()
                    logger.info(f"Successfully inserted alert {alert_record.id} into Supabase alerts table.")
                except Exception as e:
                    logger.warning(f"Supabase alerts table insert notice: {e}")

        return {
            "email": email_record,
            "threat": threat_record,
            "analysis": analysis_record,
            "ip_intelligence": ip_intel,
            "geolocation": geo_intel,
            "alert": alert_record
        }

gmail_service = GmailService()
