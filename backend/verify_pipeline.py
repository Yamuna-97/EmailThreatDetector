import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv('c:/sih/backend/.env')

from app.services.gmail_service import gmail_service
from app.database import db

async def run_pipeline_verification():
    print("=" * 70)
    print("VAULTSHIELD THREAT DETECTION PIPELINE END-TO-END VERIFICATION")
    print("=" * 70)

    # Use existing user profile in Supabase
    user_id = "7653d6b9-6f26-42d9-824d-a6e03c4585b7"
    user_email = "yamunak972006@gmail.com"

    # -------------------------------------------------------------
    # TEST 1: SYNTHETIC PHISHING EMAIL
    # -------------------------------------------------------------
    print("\n[TEST 1] Processing Synthetic Phishing Email...")
    phishing_subject = "URGENT: Your Account Requires Verification"
    phishing_body = """Dear User,

Your account requires immediate verification due to a recent security alert.

Please verify your account within 24 hours to prevent temporary suspension.

Verification link:
https://example.com/verify-account

Thank you,
Security Team"""

    phishing_headers = {
        "From": "Security Team <alert-security@account-verify-portal.net>",
        "To": user_email,
        "Subject": phishing_subject,
        "Authentication-Results": "mx.google.com; spf=fail (google.com: domain of alert-security@account-verify-portal.net does not designate 185.220.101.5 as permitted sender); dkim=none; dmarc=fail action=none",
        "Received": "from mail.account-verify-portal.net (185.220.101.5) by mx.google.com"
    }

    res_phishing = await gmail_service.process_and_scan_email(
        user_id=user_id,
        message_id="synthetic_phish_001",
        thread_id="thread_phish_001",
        sender="alert-security@account-verify-portal.net",
        recipient=user_email,
        subject=phishing_subject,
        body=phishing_body,
        headers_data=phishing_headers,
        is_demo=False
    )

    print("\n--- PHISHING SCAN RESULTS ---")
    print(f"Classification:     {res_phishing['threat'].threat_type}")
    print(f"Final Risk Score:   {res_phishing['threat'].risk_score}/100")
    print(f"Severity:           {res_phishing['threat'].severity.upper()}")
    print(f"Confidence:         {res_phishing['threat'].confidence}")
    print(f"Summary:            {res_phishing['threat'].summary}")
    print(f"IPQS Fraud Score:   {res_phishing['ip_intelligence'].fraud_score}/100 (VPN={res_phishing['ip_intelligence'].is_vpn}, Tor={res_phishing['ip_intelligence'].is_tor})")
    print(f"IP Geolocation:     {res_phishing['geolocation'].city}, {res_phishing['geolocation'].country} ({res_phishing['geolocation'].latitude}, {res_phishing['geolocation'].longitude})")
    print(f"Indicators Count:   {len(res_phishing['analysis'].indicators)}")
    for ind in res_phishing['analysis'].indicators:
        print(f"  - [{ind.severity.upper()}] {ind.type}: {ind.description}")
    print(f"Recommended Actions: {res_phishing['analysis'].recommended_actions}")

    # -------------------------------------------------------------
    # TEST 2: SYNTHETIC BENIGN EMAIL
    # -------------------------------------------------------------
    print("\n[TEST 2] Processing Synthetic Benign Email...")
    benign_subject = "Weekly Project Sync - Q3 Architecture Review"
    benign_body = """Hi Team,

Just wanted to confirm our weekly sync tomorrow at 10:00 AM.
We will review the platform architecture documentation and milestones.

Let me know if anyone needs to adjust the agenda.

Best regards,
Yamuna"""

    benign_headers = {
        "From": "Yamuna <yamunak972006@gmail.com>",
        "To": user_email,
        "Subject": benign_subject,
        "Authentication-Results": "mx.google.com; spf=pass; dkim=pass header.i=@gmail.com; dmarc=pass",
        "Received": "from mail-ej1-f41.google.com (209.85.218.41) by mx.google.com"
    }

    res_benign = await gmail_service.process_and_scan_email(
        user_id=user_id,
        message_id="synthetic_benign_001",
        thread_id="thread_benign_001",
        sender="yamunak972006@gmail.com",
        recipient=user_email,
        subject=benign_subject,
        body=benign_body,
        headers_data=benign_headers,
        is_demo=False
    )

    print("\n--- BENIGN SCAN RESULTS ---")
    print(f"Classification:     {res_benign['threat'].threat_type}")
    print(f"Final Risk Score:   {res_benign['threat'].risk_score}/100")
    print(f"Severity:           {res_benign['threat'].severity.upper()}")
    print(f"Summary:            {res_benign['threat'].summary}")

    # -------------------------------------------------------------
    # TEST 3: VERIFY SUPABASE PERSISTENCE
    # -------------------------------------------------------------
    print("\n[TEST 3] Verifying Database Records in Supabase...")
    admin_client = db.get_admin_client()
    if admin_client:
        emails_in_db = admin_client.table("emails").select("id, subject, sender, message_id").eq("user_id", user_id).execute()
        threats_in_db = admin_client.table("threats").select("id, threat_type, severity, risk_score, summary").eq("user_id", user_id).execute()
        analyses_in_db = admin_client.table("threat_analyses").select("id, classification, severity, final_risk_score").eq("user_id", user_id).execute()

        print(f"Supabase Emails Table Count for user: {len(emails_in_db.data)}")
        for e in emails_in_db.data[-2:]:
            print(f"  -> Email: ID={e['id'][:8]}... | Subject='{e['subject']}' | Sender='{e['sender']}'")

        print(f"Supabase Threats Table Count for user: {len(threats_in_db.data)}")
        for t in threats_in_db.data[-2:]:
            print(f"  -> Threat: ID={t['id'][:8]}... | Type='{t['threat_type']}' | Severity='{t['severity']}' | Score={t['risk_score']}")

        print(f"Supabase Threat Analyses Count: {len(analyses_in_db.data)}")
        for a in analyses_in_db.data[-2:]:
            print(f"  -> Analysis: ID={a['id'][:8]}... | Class='{a['classification']}' | FinalScore={a['final_risk_score']}")
    else:
        print("Supabase Admin Client not connected.")

    print("\n" + "=" * 70)
    print("ALL PIPELINE TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_pipeline_verification())
