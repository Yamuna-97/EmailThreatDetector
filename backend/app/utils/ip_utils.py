import ipaddress
import re
from typing import List, Optional

IPV4_PATTERN = r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'
IPV6_PATTERN = r'\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b'

def is_valid_ip(ip: str) -> bool:
    """Validate whether an IP address is valid IPv4 or IPv6."""
    try:
        ipaddress.ip_address(ip.strip())
        return True
    except ValueError:
        return False

def is_private_ip(ip: str) -> bool:
    """Check if an IP address is a private, loopback, or reserved address."""
    try:
        ip_obj = ipaddress.ip_address(ip.strip())
        return ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local
    except ValueError:
        return True

def extract_ips_from_text(text: str) -> List[str]:
    """Extract all distinct valid IP addresses from text, separating public and private."""
    if not text:
        return []
    
    matches = re.findall(IPV4_PATTERN, text)
    valid_ips = []
    for ip in set(matches):
        if is_valid_ip(ip):
            valid_ips.append(ip)
    return valid_ips

def extract_public_ips_from_headers(received_headers: List[str]) -> List[str]:
    """
    Extract public origin IPs from email Received headers.
    Headers are evaluated to find external hop IPs rather than internal LAN relays.
    """
    public_ips = []
    for header in received_headers:
        ips = extract_ips_from_text(header)
        for ip in ips:
            if not is_private_ip(ip) and ip not in public_ips:
                public_ips.append(ip)
    return public_ips
