import httpx
import logging
from typing import Optional
from app.config import settings
from app.schemas.geolocation import GeoLocationModel
from app.utils.ip_utils import is_valid_ip, is_private_ip
from app.database import db

logger = logging.getLogger("vaultshield.geolocation")

class GeoLocationService:
    def __init__(self):
        self.api_key = settings.IP_GEOLOCATION_API_KEY
        self.base_url = settings.IP_GEOLOCATION_BASE_URL.rstrip('/')

    async def get_geolocation(self, ip: str) -> GeoLocationModel:
        """
        Resolve IP address to approximate geographic coordinates, country, city, ISP.
        Labeled as Approximate IP-based geolocation. Never halts scanning pipeline on error.
        """
        if not is_valid_ip(ip):
            return GeoLocationModel(ip=ip, country="Invalid IP", city="N/A")

        if is_private_ip(ip):
            return GeoLocationModel(
                ip=ip,
                country="Private Network (RFC1918)",
                country_code="LAN",
                city="Local Subnet",
                latitude=0.0,
                longitude=0.0,
                isp="Local / Intranet Gateway"
            )

        # Check in-memory cache
        if ip in db.store["geolocations"]:
            return db.store["geolocations"][ip]

        # 1. Primary Attempt: ipapi.co (with or without key)
        try:
            url = f"https://ipapi.co/{ip}/json/"
            if self.api_key and len(self.api_key) > 10:
                url_with_key = f"{url}?key={self.api_key}"
            else:
                url_with_key = url

            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url_with_key, headers={"User-Agent": "VaultShield-SIH-Platform/2.0"})
                if resp.status_code == 200:
                    data = resp.json()
                    if not data.get("error"):
                        geo = GeoLocationModel(
                            ip=ip,
                            country=data.get("country_name") or data.get("country", "Unknown"),
                            country_code=data.get("country_code") or data.get("countryCode", "XX"),
                            region=data.get("region"),
                            city=data.get("city") or "Unknown",
                            latitude=float(data.get("latitude") or data.get("lat") or 0.0),
                            longitude=float(data.get("longitude") or data.get("lon") or 0.0),
                            timezone=data.get("timezone"),
                            isp=data.get("org") or data.get("isp"),
                            asn=data.get("asn") or data.get("as")
                        )
                        db.store["geolocations"][ip] = geo
                        return geo
                elif resp.status_code in [401, 403] and self.api_key:
                    # Key invalid or rate-limited on ipapi.co; retry immediately without key
                    logger.info(f"ipapi.co returned {resp.status_code} with key. Retrying with public rate-limit...")
                    resp_public = await client.get(url, headers={"User-Agent": "VaultShield-SIH-Platform/2.0"})
                    if resp_public.status_code == 200:
                        data = resp_public.json()
                        if not data.get("error"):
                            geo = GeoLocationModel(
                                ip=ip,
                                country=data.get("country_name") or data.get("country", "Unknown"),
                                country_code=data.get("country_code") or data.get("countryCode", "XX"),
                                region=data.get("region"),
                                city=data.get("city") or "Unknown",
                                latitude=float(data.get("latitude") or data.get("lat") or 0.0),
                                longitude=float(data.get("longitude") or data.get("lon") or 0.0),
                                timezone=data.get("timezone"),
                                isp=data.get("org") or data.get("isp"),
                                asn=data.get("asn") or data.get("as")
                            )
                            db.store["geolocations"][ip] = geo
                            return geo
        except Exception as e:
            logger.warning(f"Primary GeoLocation (ipapi.co) notice for {ip}: {type(e).__name__}")

        # 2. Secondary Fallback: ip-api.com
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"http://ip-api.com/json/{ip}", headers={"User-Agent": "VaultShield-SIH-Platform/2.0"})
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "success":
                        geo = GeoLocationModel(
                            ip=ip,
                            country=data.get("country", "Unknown"),
                            country_code=data.get("countryCode", "XX"),
                            region=data.get("regionName") or data.get("region"),
                            city=data.get("city") or "Unknown",
                            latitude=float(data.get("lat") or 0.0),
                            longitude=float(data.get("lon") or 0.0),
                            timezone=data.get("timezone"),
                            isp=data.get("isp"),
                            asn=data.get("as")
                        )
                        db.store["geolocations"][ip] = geo
                        return geo
        except Exception as e:
            logger.warning(f"Secondary GeoLocation (ip-api.com) notice for {ip}: {type(e).__name__}")

        # 3. Graceful Fallback (approximate indicator so pipeline proceeds uninterrupted)
        geo = GeoLocationModel(
            ip=ip,
            country="Approximate Route (Unavailable)",
            country_code="--",
            city="Geolocation unavailable",
            latitude=0.0,
            longitude=0.0,
            isp="N/A"
        )
        db.store["geolocations"][ip] = geo
        return geo

geolocation_service = GeoLocationService()
