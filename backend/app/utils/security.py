import re
import html
from typing import Optional

def sanitize_html(raw_html: str) -> str:
    """Sanitize HTML email body content to prevent XSS while preserving structural tags."""
    if not raw_html:
        return ""
    # Strip script tags, iframes, objects, and event handlers
    clean = re.sub(r'<script.*?>.*?</script>', '', raw_html, flags=re.DOTALL | re.IGNORECASE)
    clean = re.sub(r'<iframe.*?>.*?</iframe>', '', clean, flags=re.DOTALL | re.IGNORECASE)
    clean = re.sub(r'<object.*?>.*?</object>', '', clean, flags=re.DOTALL | re.IGNORECASE)
    clean = re.sub(r'on\w+\s*=\s*["\'].*?["\']', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'javascript:', '', clean, flags=re.IGNORECASE)
    return clean

def mask_email(email: str) -> str:
    """Mask email for privacy in logs (e.g., a***t@example.com)."""
    if not email or '@' not in email:
        return "***"
    parts = email.split('@')
    user = parts[0]
    domain = parts[1]
    if len(user) <= 2:
        masked_user = user[0] + "*"
    else:
        masked_user = user[0] + "*" * (len(user) - 2) + user[-1]
    return f"{masked_user}@{domain}"
