import smtplib
import ssl
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("vaultshield.smtp")

class SMTPAlertService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.default_recipient = settings.ALERT_RECIPIENT_EMAIL or settings.SMTP_USER

    async def send_critical_threat_alert_async(
        self,
        recipient_email: str,
        threat_data: Dict[str, Any],
        email_data: Dict[str, Any],
        analysis_data: Dict[str, Any]
    ):
        """Asynchronously trigger SMTP threat warning email without blocking main thread."""
        asyncio.create_task(
            asyncio.to_thread(
                self.send_critical_threat_alert_sync,
                recipient_email,
                threat_data,
                email_data,
                analysis_data
            )
        )

    def send_critical_threat_alert_sync(
        self,
        recipient_email: str,
        threat_data: Dict[str, Any],
        email_data: Dict[str, Any],
        analysis_data: Dict[str, Any]
    ) -> bool:
        """
        Send formatted Security Alert Warning email via Gmail SMTP for Critical Threats.
        """
        to_email = recipient_email or self.default_recipient
        if not self.smtp_user or not self.smtp_password or not to_email:
            logger.warning("SMTP Alert skipped: missing SMTP_USER, SMTP_PASSWORD, or recipient email.")
            return False

        threat_type = threat_data.get("threat_type", "Critical Security Incident")
        risk_score = threat_data.get("risk_score", 95)
        severity = str(threat_data.get("severity", "CRITICAL")).upper()
        summary = threat_data.get("summary", "Critical email threat detected by VaultShield.")
        
        sender = email_data.get("sender", "Unknown Sender")
        subject = email_data.get("subject", "No Subject")
        
        indicators: List[Dict[str, Any]] = analysis_data.get("indicators", [])
        actions: List[str] = analysis_data.get("recommended_actions", [
            "Do NOT click any links inside the suspicious email.",
            "Do NOT download or open any attachments.",
            "Report the email to your cybersecurity operations center immediately."
        ])

        # Prepare Message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🚨 [VAULTSHIELD ALERT] {severity} Threat Detected: {threat_type} ({risk_score}/100)"
        msg["From"] = f"VaultShield Threat Intelligence <{self.smtp_user}>"
        msg["To"] = to_email

        # Plain text version
        plain_text = f"""
================================================================================
VAULTSHIELD - AUTOMATED CYBERSECURITY THREAT ALERT
================================================================================
CRITICAL SECURITY WARNING: An email sent to your account has been classified
as a {severity} threat ({risk_score}/100 Risk Score) by VaultShield AI.

INCIDENT DETAILS:
--------------------------------------------------------------------------------
* Classification : {threat_type}
* Severity       : {severity}
* Final Risk     : {risk_score}/100
* Sender         : {sender}
* Subject        : {subject}
* Detection Time : {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}

FORENSIC SUMMARY:
{summary}

DETECTED THREAT INDICATORS:
"""
        for idx, ind in enumerate(indicators, 1):
            itype = ind.get("type", "indicator") if isinstance(ind, dict) else getattr(ind, "type", "indicator")
            idesc = ind.get("description", "") if isinstance(ind, dict) else getattr(ind, "description", "")
            plain_text += f"\n  {idx}. [{itype.upper()}] {idesc}"

        plain_text += f"""

RECOMMENDED IMMEDIATE DEFENSIVE ACTIONS:
"""
        for idx, act in enumerate(actions, 1):
            plain_text += f"\n  {idx}. {act}"

        plain_text += f"""

--------------------------------------------------------------------------------
Protect your organization: Inspect full forensics at http://localhost:5173
VaultShield Platform - SIH 2026 AI Cybersecurity Defense
================================================================================
"""

        # Rich HTML version
        indicators_html = "".join([
            f"<li style='margin-bottom:8px;'><strong>[{ind.get('type', 'Threat') if isinstance(ind, dict) else getattr(ind, 'type', 'Threat')}]:</strong> {ind.get('description', '') if isinstance(ind, dict) else getattr(ind, 'description', '')}</li>"
            for ind in indicators
        ]) or "<li>High severity risk anomalies identified in email headers & content.</li>"

        actions_html = "".join([
            f"<li style='margin-bottom:6px; color:#991B1B;'><strong>{act}</strong></li>"
            for act in actions
        ])

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; }}
    .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
    .header {{ background: linear-gradient(135deg, #DC2626, #991B1B); color: #ffffff; padding: 24px; text-align: center; }}
    .content {{ padding: 24px; color: #1e293b; line-height: 1.6; font-size: 14px; }}
    .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; background: rgba(255,255,255,0.2); font-weight: bold; font-size: 12px; }}
    .score-box {{ background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 12px; padding: 16px; margin: 16px 0; }}
    .actions-box {{ background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 16px; margin: 16px 0; }}
    .footer {{ background: #F8FAFC; padding: 16px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">🚨 SECURITY INCIDENT ALERT</div>
      <h1 style="margin: 8px 0 0 0; font-size: 22px;">Critical Email Threat Detected</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>VaultShield's AI Threat Detection platform scanned an incoming email in your mailbox and detected a <strong>{severity}</strong> threat requiring immediate attention.</p>
      
      <div class="score-box">
        <table style="width: 100%; font-size: 13px;">
          <tr><td><strong>Threat Type:</strong></td><td style="color:#DC2626; font-weight:bold;">{threat_type}</td></tr>
          <tr><td><strong>Risk Score:</strong></td><td style="color:#DC2626; font-weight:bold;">{risk_score}/100 ({severity})</td></tr>
          <tr><td><strong>Sender:</strong></td><td><code>{sender}</code></td></tr>
          <tr><td><strong>Subject:</strong></td><td>{subject}</td></tr>
        </table>
      </div>

      <h4 style="margin-bottom: 8px; color: #0F172A;">Forensic Summary:</h4>
      <p style="background:#F1F5F9; padding:12px; border-radius:8px; font-size:13px;">{summary}</p>

      <h4 style="margin-bottom: 8px; color: #0F172A;">Detected Threat Indicators:</h4>
      <ul style="padding-left: 20px; font-size: 13px;">
        {indicators_html}
      </ul>

      <div class="actions-box">
        <h4 style="margin:0 0 8px 0; color:#92400E;">Recommended Immediate Actions:</h4>
        <ul style="padding-left: 20px; font-size: 13px; margin:0;">
          {actions_html}
        </ul>
      </div>

      <p style="margin-top:20px; text-align:center;">
        <a href="http://localhost:5173" style="display:inline-block; padding:10px 20px; background:#7342E2; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:13px;">View Incident in VaultShield Dashboard &rarr;</a>
      </p>
    </div>
    <div class="footer">
      VaultShield AI Threat Detection &bull; SIH 2026 &bull; Automated SOC Alert
    </div>
  </div>
</body>
</html>
"""

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Try Port 587 (TLS) first, then Port 465 (SSL)
        # 1. Attempt TLS on port 587
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=8) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.smtp_user, [to_email], msg.as_string())
                logger.info(f"Critical Threat Warning Email sent via SMTP (587 TLS) to {to_email}")
                return True
        except Exception as e587:
            logger.debug(f"SMTP port 587 notice: {e587}. Trying port 465 SSL...")

        # 2. Attempt SSL on port 465
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(self.smtp_host, 465, context=context, timeout=8) as server:
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.smtp_user, [to_email], msg.as_string())
                logger.info(f"Critical Threat Warning Email sent via SMTP (465 SSL) to {to_email}")
                return True
        except Exception as e465:
            logger.warning(f"SMTP alert delivery notice (587/465): {e465}. Threat recorded in database and dashboard alert.")
            return False

smtp_alert_service = SMTPAlertService()
