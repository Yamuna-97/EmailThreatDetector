import re
import email
from email import policy
from email.parser import BytesParser, Parser
import base64
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.schemas.email import EmailHeaderInfo, EmailAttachmentInfo
from app.utils.ip_utils import extract_public_ips_from_headers, extract_ips_from_text
from app.utils.security import sanitize_html

class EmailParser:
    @staticmethod
    def parse_authentication_results(auth_header: str) -> Dict[str, str]:
        """Extract SPF, DKIM, and DMARC results from Authentication-Results header."""
        results = {"spf": "unknown", "dkim": "unknown", "dmarc": "unknown"}
        if not auth_header:
            return results
        
        auth_lower = auth_header.lower()
        
        # SPF match
        spf_match = re.search(r'spf=(\w+)', auth_lower)
        if spf_match:
            results["spf"] = spf_match.group(1)
        elif "spf=pass" in auth_lower:
            results["spf"] = "pass"
        elif "spf=fail" in auth_lower:
            results["spf"] = "fail"

        # DKIM match
        dkim_match = re.search(r'dkim=(\w+)', auth_lower)
        if dkim_match:
            results["dkim"] = dkim_match.group(1)
        elif "dkim=pass" in auth_lower:
            results["dkim"] = "pass"
        elif "dkim=fail" in auth_lower:
            results["dkim"] = "fail"

        # DMARC match
        dmarc_match = re.search(r'dmarc=(\w+)', auth_lower)
        if dmarc_match:
            results["dmarc"] = dmarc_match.group(1)
        elif "dmarc=pass" in auth_lower:
            results["dmarc"] = "pass"
        elif "dmarc=fail" in auth_lower:
            results["dmarc"] = "fail"

        return results

    @classmethod
    def parse_raw_headers(cls, headers_dict: Dict[str, Any]) -> EmailHeaderInfo:
        """Parse structured headers from headers dictionary."""
        received_list = []
        auth_results = None
        from_hdr = None
        to_hdr = None
        reply_to = None
        return_path = None
        
        # Handle dict or list of {name, value}
        if isinstance(headers_dict, list):
            for h in headers_dict:
                name = h.get("name", "").lower()
                val = h.get("value", "")
                if name == "received":
                    received_list.append(val)
                elif name == "authentication-results":
                    auth_results = val
                elif name == "from":
                    from_hdr = val
                elif name == "to":
                    to_hdr = val
                elif name == "reply-to":
                    reply_to = val
                elif name == "return-path":
                    return_path = val
        elif isinstance(headers_dict, dict):
            from_hdr = headers_dict.get("From") or headers_dict.get("from")
            to_hdr = headers_dict.get("To") or headers_dict.get("to")
            reply_to = headers_dict.get("Reply-To") or headers_dict.get("reply-to")
            return_path = headers_dict.get("Return-Path") or headers_dict.get("return-path")
            auth_results = headers_dict.get("Authentication-Results") or headers_dict.get("authentication-results")
            rec = headers_dict.get("Received") or headers_dict.get("received")
            if isinstance(rec, list):
                received_list = rec
            elif rec:
                received_list = [str(rec)]

        auth_parsed = cls.parse_authentication_results(auth_results or "")
        
        # Extract external source IP
        public_ips = extract_public_ips_from_headers(received_list)
        source_ip = public_ips[0] if public_ips else None

        return EmailHeaderInfo(
            from_header=from_hdr,
            to_header=to_hdr,
            reply_to=reply_to,
            return_path=return_path,
            received_headers=received_list,
            auth_results=auth_results,
            spf=auth_parsed["spf"],
            dkim=auth_parsed["dkim"],
            dmarc=auth_parsed["dmarc"],
            source_ip=source_ip
        )

    @classmethod
    def parse_mime_message(cls, raw_bytes: bytes) -> Dict[str, Any]:
        """Parse raw RFC822 / MIME bytes into normalized email data."""
        msg = BytesParser(policy=policy.default).parsebytes(raw_bytes)
        
        headers_dict = {}
        received_list = []
        for k, v in msg.items():
            if k.lower() == 'received':
                received_list.append(str(v))
            else:
                headers_dict[k] = str(v)
        headers_dict['received'] = received_list
        
        plain_body = ""
        html_body = ""
        attachments = []

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disp = str(part.get('Content-Disposition') or '')
                
                if 'attachment' in content_disp:
                    filename = part.get_filename() or 'unnamed_attachment'
                    payload = part.get_payload(decode=True)
                    size = len(payload) if payload else 0
                    
                    # Risk checks
                    is_suspicious = False
                    risk_reason = None
                    if any(filename.lower().endswith(ext) for ext in ['.exe', '.scr', '.vbs', '.js', '.bat', '.cmd', '.iso', '.hta', '.xlsm']):
                        is_suspicious = True
                        risk_reason = "Executable or script payload detected"
                    
                    attachments.append(EmailAttachmentInfo(
                        filename=filename,
                        file_type=content_type,
                        file_size=size,
                        is_suspicious=is_suspicious,
                        risk_reason=risk_reason
                    ))
                elif content_type == 'text/plain' and not plain_body:
                    plain_body = part.get_content()
                elif content_type == 'text/html' and not html_body:
                    html_body = sanitize_html(part.get_content())
        else:
            if msg.get_content_type() == 'text/html':
                html_body = sanitize_html(msg.get_content())
            else:
                plain_body = msg.get_content()

        return {
            "headers": cls.parse_raw_headers(headers_dict),
            "plain_text_body": plain_body,
            "html_body": html_body,
            "attachments": attachments,
            "subject": msg.get("Subject", "(No Subject)"),
            "sender": msg.get("From", ""),
            "recipient": msg.get("To", ""),
            "date": msg.get("Date", "")
        }

email_parser = EmailParser()
