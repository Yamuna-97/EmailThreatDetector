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
    Used for the interactive Global Threat Vector Map.
    """
    map_points = []
    
    # Collate active geolocations from recorded threat incidents
    for ip, geo in db.store["geolocations"].items():
        intel = db.store["ip_intelligence"].get(ip)
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
            "disclaimer": "IP-based approximate location"
        })

    # Default fallback hot-points if store is fresh
    if not map_points:
        map_points = [
            {"ip": "185.220.101.5", "country": "Germany", "country_code": "DE", "city": "Frankfurt", "latitude": 50.1109, "longitude": 8.6821, "isp": "Tor Exit Node Transit", "asn": "AS206349", "fraud_score": 96, "is_tor": True, "disclaimer": "IP-based approximate location"},
            {"ip": "193.106.191.22", "country": "Russia", "country_code": "RU", "city": "Moscow", "latitude": 55.7558, "longitude": 37.6173, "isp": "Bulletproof VPS Host", "asn": "AS49505", "fraud_score": 92, "is_vpn": True, "disclaimer": "IP-based approximate location"},
            {"ip": "192.241.218.45", "country": "United States", "country_code": "US", "city": "New York", "latitude": 40.7128, "longitude": -74.0060, "isp": "Cloud VPS Hosting", "asn": "AS14061", "fraud_score": 78, "is_proxy": True, "disclaimer": "IP-based approximate location"},
            {"ip": "164.100.158.20", "country": "India", "country_code": "IN", "city": "New Delhi", "latitude": 28.6139, "longitude": 77.2090, "isp": "National Informatics Centre", "asn": "AS4758", "fraud_score": 5, "is_vpn": False, "disclaimer": "IP-based approximate location"}
        ]

    return map_points

@router.get("/{ip}", response_model=GeoLocationModel)
async def lookup_ip_geolocation(
    ip: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Lookup approximate geolocation metadata for an individual IP."""
    return await geolocation_service.get_geolocation(ip)
