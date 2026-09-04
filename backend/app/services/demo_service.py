import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.services.gmail_service import gmail_service
from app.database import db

DEMO_SCENARIOS = [
    {
        "message_id": "demo_msg_001_chase_phish",
        "sender": "security-alert@chase-secure-verify.net",
        "recipient": "analyst@enterprise.gov.in",
        "subject": "[URGENT] Security Alert: Unauthorized Wire Transfer Detected ($4,850.00)",
        "body": (
            "Dear Customer,\n\n"
            "We detected an unauthorized wire transfer of $4,850.00 from your corporate checking account.\n"
            "If you did not authorize this payment, you must verify your identity immediately to prevent fund settlement:\n\n"
            "https://chase-secure-verify.net/auth/login?session=98432a\n\n"
            "Failure to verify within 2 hours will result in irreversible transaction processing.\n\n"
            "Chase Fraud Prevention Team\nCase ID: #CH-99201"
        ),
        "headers": {
            "From": "security-alert@chase-secure-verify.net",
            "To": "analyst@enterprise.gov.in",
            "Authentication-Results": "spf=fail (sender IP 185.220.101.5 is not authorized); dmarc=fail action=none; dkim=none",
            "Received": ["from mail.chase-secure-verify.net ([185.220.101.5]) by mx.google.com with ESMTPS"],
            "Return-Path": "<bounce@chase-secure-verify.net>"
        }
    },
    {
        "message_id": "demo_msg_002_microsoft_mfa",
        "sender": "admin@login-microsoftonline-verify.xyz",
        "recipient": "executive@enterprise.gov.in",
        "subject": "Microsoft 365: Mandatory Multi-Factor Authentication (MFA) Re-enrollment",
        "body": (
            "Your Microsoft 365 Enterprise Security certificate has expired.\n"
            "Your account will be suspended in 24 hours unless you re-authenticate your tenant credentials below:\n\n"
            "https://login-microsoftonline-verify.xyz/oauth2/authorize?token=f893a\n\n"
            "IT Infrastructure Support Team"
        ),
        "headers": {
            "From": "admin@login-microsoftonline-verify.xyz",
            "To": "executive@enterprise.gov.in",
            "Authentication-Results": "spf=fail; dkim=fail; dmarc=fail",
            "Received": ["from relay01.xyz-hosting.ru ([193.106.191.22]) by mx.google.com"],
            "Return-Path": "<bounce@xyz-hosting.ru>"
        }
    },
    {
        "message_id": "demo_msg_003_hr_payroll",
        "sender": "hr-payroll@global-hr-update.click",
        "recipient": "employee@enterprise.gov.in",
        "subject": "Immediate Action Required: Annual Compensation & Bonus Adjustment",
        "body": (
            "All staff members must review and digitally sign their revised Q3 bonus compensation statement.\n\n"
            "Please click the secure HR portal link to sign:\n"
            "http://192.241.218.45/hr/portal/signin\n\n"
            "Human Resources & Payroll Office"
        ),
        "headers": {
            "From": "hr-payroll@global-hr-update.click",
            "To": "employee@enterprise.gov.in",
            "Authentication-Results": "spf=softfail; dkim=none; dmarc=fail",
            "Received": ["from direct-vps ([192.241.218.45]) by mx.google.com"],
            "Return-Path": "<hr@global-hr-update.click>"
        }
    },
    {
        "message_id": "demo_msg_004_safe_newsletter",
        "sender": "newsletter@cert-in.org.in",
        "recipient": "analyst@enterprise.gov.in",
        "subject": "CERT-In Cyber Security Advisory: Best Practices for Enterprise Email Defense",
        "body": (
            "Dear Stakeholder,\n\n"
            "CERT-In has released its monthly advisory regarding email defense and DNSSEC hardening.\n"
            "Read the official bulletin on our government portal: https://www.cert-in.org.in/advisories\n\n"
            "Indian Computer Emergency Response Team (CERT-In)\nMinistry of Electronics and Information Technology"
        ),
        "headers": {
            "From": "newsletter@cert-in.org.in",
            "To": "analyst@enterprise.gov.in",
            "Authentication-Results": "spf=pass (sender IP 164.100.158.20 is authorized); dkim=pass; dmarc=pass",
            "Received": ["from mail.gov.in ([164.100.158.20]) by mx.google.com"],
            "Return-Path": "<bounce@cert-in.org.in>"
        }
    }
]

class DemoService:
    @staticmethod
    async def seed_demo_data(user_id: str) -> List[Dict[str, Any]]:
        """Populate realistic demo emails and threat analyses for SIH evaluation."""
        results = []
        for scenario in DEMO_SCENARIOS:
            res = await gmail_service.process_and_scan_email(
                user_id=user_id,
                message_id=scenario["message_id"],
                thread_id=f"thread_{scenario['message_id']}",
                sender=scenario["sender"],
                recipient=scenario["recipient"],
                subject=scenario["subject"],
                body=scenario["body"],
                headers_data=scenario["headers"],
                is_demo=True
            )
            results.append(res)
        return results

demo_service = DemoService()
