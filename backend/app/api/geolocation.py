import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.geolocation import GeoLocationModel
from app.services.geolocation_service import geolocation_service
from app.database import db

logger = logging.getLogger("vaultshield.api.geolocation")
router = APIRouter(prefix="/geolocation", tags=["GeoLocation & Threat Map"])

@router.get("/threat-map")
async def get_threat_map_locations(current_user: UserResponse = Depends(get_current_user)):
    """
    Retrieve approximate IP-based coordinates for all detected threats.
    Enriched with user email, subject, sender, and threat details for map interactivity.
    """
    map_points = []
    
    admin_client = db.get_admin_client()
    users_by_id = {}
    emails_by_ip = {}
    threats_by_email_id = {}

    # Build lookup dicts from memory store
    for u in db.store["users"].values():
        users_by_id[u.id] = u.email

    for e in db.store["emails"].values():
        ip = getattr(e.headers, "source_ip", None) if getattr(e, "headers", None) else None
        if ip:
            emails_by_ip[ip] = e

    for t in db.store["threats"].values():
        if getattr(t, "email_id", None):
            threats_by_email_id[t.email_id] = t

    # Collate active geolocations from recorded threat incidents
    for ip, geo in db.store["geolocations"].items():
        intel = db.store["ip_intelligence"].get(ip)
        matched_email = emails_by_ip.get(ip)
        matched_threat = threats_by_email_id.get(matched_email.id) if matched_email else None
        user_email = users_by_id.get(matched_email.user_id) if matched_email else "yamunak972006@gmail.com"

        map_points.append({
            "ip": ip,
            "country": geo.country,
            "country_code": geo.country_code,
            "city": geo.city,
            "latitude": geo.latitude,
            "longitude": geo.longitude,
            "isp": geo.isp,
            "asn": geo.asn,
            "fraud_score": intel.fraud_score if intel else 20,
            "is_vpn": intel.is_vpn if intel else False,
            "is_proxy": intel.is_proxy if intel else False,
            "is_tor": intel.is_tor if intel else False,
            "disclaimer": "IP-based approximate location",
            "threat_id": matched_threat.id if matched_threat else None,
            "user_email": user_email,
            "sender": matched_email.sender if matched_email else "verify-security@unknown-host.com",
            "subject": matched_email.subject if matched_email else "Urgent Account Verification Alert",
            "threat_type": matched_threat.threat_type if matched_threat else "Phishing Scam Vector",
            "severity": matched_threat.severity if matched_threat else "high",
            "risk_score": matched_threat.risk_score if matched_threat else (intel.fraud_score if intel else 85)
        })

    # Default fallback hot-points if store is fresh
    if not map_points:
        map_points = [
            {
                "ip": "185.220.101.5",
                "country": "Germany",
                "country_code": "DE",
                "city": "Frankfurt",
                "latitude": 50.1109,
                "longitude": 8.6821,
                "isp": "Tor Exit Node Transit",
                "asn": "AS206349",
                "fraud_score": 96,
                "is_tor": True,
                "disclaimer": "IP-based approximate location",
                "threat_id": "demo-threat-001",
                "user_email": "yamunak972006@gmail.com",
                "sender": "account-update@suspicious-bank-login.de",
                "subject": "CRITICAL: Urgent Banking Credentials Verification Required",
                "threat_type": "Credential Theft / Phishing",
                "severity": "critical",
                "risk_score": 96
            },
            {
                "ip": "193.106.191.22",
                "country": "Russia",
                "country_code": "RU",
                "city": "Moscow",
                "latitude": 55.7558,
                "longitude": 37.6173,
                "isp": "Bulletproof VPS Host",
                "asn": "AS49505",
                "fraud_score": 92,
                "is_vpn": True,
                "disclaimer": "IP-based approximate location",
                "threat_id": "demo-threat-002",
                "user_email": "yamunak972006@gmail.com",
                "sender": "ceo-office@enterprise-partner-fake.ru",
                "subject": "URGENT: Executive Wire Transfer Authorization Needed Immediately",
                "threat_type": "Business Email Compromise (BEC)",
                "severity": "critical",
                "risk_score": 92
            },
            {
                "ip": "192.241.218.45",
                "country": "United States",
                "country_code": "US",
                "city": "New York",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "isp": "Cloud VPS Hosting",
                "asn": "AS14061",
                "fraud_score": 78,
                "is_proxy": True,
                "disclaimer": "IP-based approximate location",
                "threat_id": "demo-threat-003",
                "user_email": "yamunak972006@gmail.com",
                "sender": "security-team@vaultshield-support-fake.com",
                "subject": "Security Warning: Password Expiration Notice",
                "threat_type": "Phishing / Spear Phishing",
                "severity": "high",
                "risk_score": 78
            },
            {
                "ip": "164.100.158.20",
                "country": "India",
                "country_code": "IN",
                "city": "New Delhi",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "isp": "National Informatics Centre",
                "asn": "AS4758",
                "fraud_score": 5,
                "is_vpn": False,
                "disclaimer": "IP-based approximate location",
                "threat_id": "demo-threat-004",
                "user_email": "yamunak972006@gmail.com",
                "sender": "notifications@vaultshield.io",
                "subject": "System Status Monthly Summary Report",
                "threat_type": "Clean Email / Low Risk",
                "severity": "low",
                "risk_score": 5
            }
        ]

    return map_points

@router.get("/{ip}", response_model=GeoLocationModel)
async def lookup_ip_geolocation(
    ip: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Lookup approximate geolocation metadata for an individual IP."""
    return await geolocation_service.get_geolocation(ip)
