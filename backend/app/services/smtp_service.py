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

    async def send_otp_email_async(self, recipient_email: str, otp_code: str, purpose: str = "signup", user_name: str = ""):
        """Asynchronously dispatch 6-digit OTP email in background task."""
        asyncio.create_task(
            asyncio.to_thread(
                self.send_otp_email_sync,
                recipient_email,
                otp_code,
                purpose,
                user_name
            )
        )

    def send_otp_email_sync(self, recipient_email: str, otp_code: str, purpose: str = "signup", user_name: str = "") -> bool:
        """
        Send a branded VaultShield 6-digit OTP verification email for Sign Up or Password Reset.
        """
        if not self.smtp_user or not self.smtp_password:
            logger.warning("SMTP skipped: Missing SMTP_USER or SMTP_PASSWORD in environment.")
            return False

        is_reset = "forgot" in purpose.lower() or "reset" in purpose.lower()
        title = "Reset Your Password" if is_reset else "Verify Your Email Address"
        action_text = "use the one-time security code below to reset your password" if is_reset else "use the one-time security code below to verify your account and complete registration"
        greeting_name = f" {user_name}" if user_name else ""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 Your VaultShield Verification Code: {otp_code}"
        msg["From"] = f"VaultShield Security <{self.smtp_user}>"
        msg["To"] = recipient_email

        plain_text = f"""
================================================================================
VAULTSHIELD - IDENTITY VERIFICATION
================================================================================
Hello{greeting_name},

Please {action_text}:

YOUR 6-DIGIT VERIFICATION CODE:
--------------------------------------------------------------------------------
    >>  {otp_code}  <<
--------------------------------------------------------------------------------

This code will expire in 10 minutes.
If you did not initiate this request, please disregard this email.

VaultShield AI Cyber Defense Platform
================================================================================
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 24px; }}
    .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px rgba(115,66,226,0.08); }}
    .header {{ background: linear-gradient(135deg, #8B5CF6, #7342E2); color: #ffffff; padding: 28px; text-align: center; }}
    .logo {{ font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }}
    .subtitle {{ font-size: 13px; opacity: 0.9; }}
    .content {{ padding: 32px 28px; color: #192837; font-size: 14px; line-height: 1.6; text-align: center; }}
    .otp-container {{ background: #FAF9F6; border: 2px dashed #7342E2; border-radius: 16px; padding: 20px; margin: 24px 0; }}
    .otp-code {{ font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #7342E2; margin: 0; }}
    .exp-text {{ font-size: 12px; color: #64748B; margin-top: 8px; }}
    .footer {{ background: #F8FAFC; padding: 20px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; }}
    .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; background: rgba(255,255,255,0.2); font-weight: bold; font-size: 11px; margin-bottom: 8px; text-transform: uppercase; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">🛡️ VaultShield Security</div>
      <div class="logo">VaultShield AI</div>
      <div class="subtitle">{title}</div>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Hello{greeting_name},</p>
      <p style="color: #475569;">Please {action_text}:</p>
      
      <div class="otp-container">
        <div class="otp-code">{otp_code}</div>
        <div class="exp-text">⏱️ Code expires in <strong>10 minutes</strong></div>
      </div>

      <p style="font-size: 12px; color: #64748B; margin-bottom: 0;">
        If you did not request this verification, your account is safe and you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      VaultShield &bull; SIH 2026 AI Threat Intelligence Platform &bull; Zero-Trust Verification
    </div>
  </div>
</body>
</html>
"""

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # 1. Attempt TLS on 587
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=8) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.smtp_user, [recipient_email], msg.as_string())
                logger.info(f"OTP verification email successfully sent via TLS 587 to {recipient_email}")
                return True
        except Exception as e587:
            logger.debug(f"SMTP OTP port 587 notice: {e587}. Trying SSL 465...")

        # 2. Attempt SSL on 465
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(self.smtp_host, 465, context=context, timeout=8) as server:
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.smtp_user, [recipient_email], msg.as_string())
                logger.info(f"OTP verification email successfully sent via SSL 465 to {recipient_email}")
                return True
        except Exception as e465:
            logger.warning(f"SMTP OTP delivery error (587/465): {e465}")
            return False

smtp_alert_service = SMTPAlertService()
