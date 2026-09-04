import re
from urllib.parse import urlparse
from typing import List
from app.schemas.email import EmailUrlInfo
from app.utils.ip_utils import is_valid_ip

URL_REGEX = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[^\s/$.?#].[^\s]*'
SHORTENER_DOMAINS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "rb.gy"}
SUSPICIOUS_TLDS = {".xyz", ".top", ".work", ".click", ".loan", ".gq", ".ml", ".cf", ".tk", ".fit", ".rest", ".online"}

class URLAnalyzer:
    @staticmethod
    def extract_urls(text: str) -> List[str]:
        """Find all URLs inside email body/headers text."""
        if not text:
            return []
        matches = re.findall(URL_REGEX, text, flags=re.IGNORECASE)
        # Clean trailing punctuation from URLs
        cleaned = []
        for u in set(matches):
            u_clean = re.sub(r'[\.,\)\;\'\"\>]+$', '', u)
            cleaned.append(u_clean)
        return cleaned

    @classmethod
    def analyze_url(cls, raw_url: str) -> EmailUrlInfo:
        """Analyze URL for security indicators, IP hostnames, shorteners, punycode, etc."""
        try:
            parsed = urlparse(raw_url)
            hostname = parsed.hostname or ""
            protocol = parsed.scheme or "http"
            path = parsed.path or "/"
            
            is_ip = is_valid_ip(hostname)
            is_shortener = hostname.lower() in SHORTENER_DOMAINS
            is_punycode = hostname.startswith("xn--") or ".xn--" in hostname
            
            risk_flags = []
            if is_ip:
                risk_flags.append("IP-based URL hostname (often used to bypass domain reputation)")
            if is_shortener:
                risk_flags.append("URL shortener used to obscure destination")
            if is_punycode:
                risk_flags.append("Internationalized/Punycode domain (lookalike/homograph threat)")
            
            # Check suspicious TLDs
            for tld in SUSPICIOUS_TLDS:
                if hostname.lower().endswith(tld):
                    risk_flags.append(f"Suspicious high-risk top level domain ({tld})")
                    break
            
            # Check suspicious keywords in path
            path_lower = path.lower()
            if any(k in path_lower for k in ["login", "verify", "secure", "banking", "account-update", "wallet"]):
                risk_flags.append("Sensitive credential harvesting keywords in path")

            return EmailUrlInfo(
                url=raw_url,
                domain=hostname,
                protocol=protocol,
                hostname=hostname,
                path=path,
                is_ip_based=is_ip,
                is_shortener=is_shortener,
                is_punycode=is_punycode,
                risk_flags=risk_flags
            )
        except Exception:
            return EmailUrlInfo(
                url=raw_url,
                domain=raw_url,
                risk_flags=["Malformed URL format"]
            )

    @classmethod
    def analyze_all(cls, text: str) -> List[EmailUrlInfo]:
        urls = cls.extract_urls(text)
        return [cls.analyze_url(u) for u in urls]

url_analyzer = URLAnalyzer()
