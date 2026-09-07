import os
import json
import math
import re
import logging
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd

logger = logging.getLogger("vaultshield.ml")

# Absolute path resolution for model files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "email_threat_model.joblib")
CONFIG_PATH = os.path.join(BASE_DIR, "models", "feature_config.json")

# Global model and configuration references
_MODEL = None
_FEATURE_CONFIG = None

# Reference Lists for Feature Engineering
URGENCY_KEYWORDS = [
    "urgent", "immediately", "immediate", "action required", "suspended",
    "warning", "expire", "unauthorized", "critical", "alert", "notice",
    "freeze", "locked", "re-verify", "verify now", "important"
]

CREDENTIAL_KEYWORDS = [
    "password", "credential", "ssn", "pin", "social security", "login",
    "sign in", "billing", "credit card", "bank", "verify account",
    "transfer", "mfa", "auth", "security certificate"
]

FREE_PROVIDERS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
    "icloud.com", "mail.com", "protonmail.com", "gmx.com", "zoho.com", "yandex.com"
}

SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly",
    "ow.ly", "rebrand.ly", "tiny.cc"
}


def load_ml_model():
    """Load the trained Logistic Regression model pipeline and feature config."""
    global _MODEL, _FEATURE_CONFIG
    if _MODEL is not None and _FEATURE_CONFIG is not None:
        return _MODEL, _FEATURE_CONFIG

    try:
        if not os.path.exists(MODEL_PATH):
            logger.error(f"ML Model file missing at path: {MODEL_PATH}")
            return None, None
        if not os.path.exists(CONFIG_PATH):
            logger.error(f"ML Feature config missing at path: {CONFIG_PATH}")
            return None, None

        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            _MODEL = joblib.load(MODEL_PATH)
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            _FEATURE_CONFIG = json.load(f)

        logger.info("ML model loaded successfully")
        return _MODEL, _FEATURE_CONFIG
    except Exception as e:
        logger.error(f"Failed to load ML model: {e}")
        return None, None


def _calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not text:
        return 0.0
    prob = [float(text.count(c)) / len(text) for c in set(text)]
    return -sum(p * math.log2(p) for p in prob if p > 0)


def _extract_text_stats(text: Optional[str]) -> Dict[str, Any]:
    """Calculate statistical features for text fields (length, words, exclamations, uppercase ratio, keywords)."""
    s = text or ""
    length = len(s)
    words = re.findall(r'\b\w+\b', s)
    word_count = len(words)
    exclamations = s.count('!')
    uppercase_count = sum(1 for c in s if c.isupper())
    uppercase_ratio = (uppercase_count / length) if length > 0 else 0.0

    s_lower = s.lower()
    urgency_count = sum(s_lower.count(k) for k in URGENCY_KEYWORDS)
    credential_count = sum(s_lower.count(k) for k in CREDENTIAL_KEYWORDS)

    return {
        "length": length,
        "word_count": word_count,
        "exclamation_count": exclamations,
        "uppercase_ratio": float(uppercase_ratio),
        "urgency_keyword_count": urgency_count,
        "credential_keyword_count": credential_count
    }


def extract_features(email_data: Dict[str, Any], feature_columns: List[str]) -> pd.DataFrame:
    """
    Extract exact 71 features from email dict to construct DataFrame matching feature_config.json.
    """
    sender = str(email_data.get("sender") or "")
    subject = str(email_data.get("subject") or "")
    plain_body = str(email_data.get("plain_text_body") or "")
    html_body = str(email_data.get("html_body") or "")
    msg_id = str(email_data.get("message_id") or "")
    raw_text = f"{subject} {plain_body} {html_body}".strip()

    # Extract sender address and domain
    sender_match = re.search(r'<([^>]+)>', sender)
    sender_email = sender_match.group(1) if sender_match else sender
    if "@" in sender_email:
        _, from_domain = sender_email.split("@", 1)
    else:
        from_domain = ""

    from_domain = from_domain.lower().strip()

    # Headers parsing
    headers = email_data.get("headers") or {}
    if hasattr(headers, "model_dump"):
        headers_dict = headers.model_dump()
    elif isinstance(headers, dict):
        headers_dict = headers
    else:
        headers_dict = {}

    received_headers = headers_dict.get("received_headers") or []
    num_received = len(received_headers) if isinstance(received_headers, list) else 0

    spf = str(headers_dict.get("spf") or "unknown").lower()
    dkim = str(headers_dict.get("dkim") or "unknown").lower()
    dmarc = str(headers_dict.get("dmarc") or "unknown").lower()

    spf_pass = 1 if spf == "pass" else 0
    spf_fail = 1 if spf == "fail" else 0
    spf_encoded = 1 if spf_pass else (-1 if spf_fail else 0)

    dkim_pass = 1 if dkim == "pass" else 0
    dkim_fail = 1 if dkim == "fail" else 0
    dkim_encoded = 1 if dkim_pass else (-1 if dkim_fail else 0)

    dmarc_pass = 1 if dmarc == "pass" else 0
    dmarc_fail = 1 if dmarc == "fail" else 0
    dmarc_encoded = 1 if dmarc_pass else (-1 if dmarc_fail else 0)

    auth_failures = spf_fail + dkim_fail + dmarc_fail
    all_auth_pass = 1 if (spf_pass and dkim_pass and dmarc_pass) else 0

    # URLs parsing
    urls = email_data.get("urls") or []
    url_strs = []
    if isinstance(urls, list):
        for u in urls:
            if isinstance(u, str):
                url_strs.append(u)
            elif isinstance(u, dict):
                url_strs.append(u.get("url", ""))
            elif hasattr(u, "url"):
                url_strs.append(getattr(u, "url", ""))

    url_count = len(url_strs)
    has_url = 1 if url_count > 0 else 0
    url_lengths = [len(u) for u in url_strs if u]
    url_length_max = max(url_lengths) if url_lengths else 0
    url_length_avg = (sum(url_lengths) / url_count) if url_count > 0 else 0.0

    https_count = sum(1 for u in url_strs if u.lower().startswith("https://"))
    https_ratio = (https_count / url_count) if url_count > 0 else 0.0

    ip_based_url = 1 if any(re.search(r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', u) for u in url_strs) else 0
    shortened_url = 1 if any(any(domain in u.lower() for domain in SHORTENER_DOMAINS) for u in url_strs) else 0

    # Attachments
    attachments = email_data.get("attachments") or []
    has_attachments = 1 if len(attachments) > 0 else 0
    attachment_types_count = len(attachments)

    # Body emails count
    emails_in_body = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
    emails_in_body_str = " ".join(emails_in_body)

    # Compute text stats
    raw_text_stats = _extract_text_stats(raw_text)
    body_plain_stats = _extract_text_stats(plain_body)
    body_html_stats = _extract_text_stats(html_body)
    message_id_stats = _extract_text_stats(msg_id)
    emails_in_body_stats = _extract_text_stats(emails_in_body_str)
    subject_stats = _extract_text_stats(subject)

    # Phone numbers & Tracking tokens
    phone_numbers = re.findall(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', raw_text)
    num_phone_numbers = len(phone_numbers)
    contains_tracking_token = 1 if any(t in raw_text.lower() for t in ["utm_", "pixel", "track", "token="]) else 0

    # Map features dictionary
    feat_map = {
        "hour_of_day": pd.Timestamp.now().hour,
        "num_received_headers": num_received,
        "has_html": 1 if len(html_body) > 0 else 0,
        "num_phone_numbers": num_phone_numbers,
        "contains_tracking_token": contains_tracking_token,
        "x_spam_score": 0.0,
        "label": 0,
        "spf_result_encoded": spf_encoded,
        "spf_result_pass": spf_pass,
        "spf_result_fail": spf_fail,
        "dkim_result_encoded": dkim_encoded,
        "dkim_result_pass": dkim_pass,
        "dkim_result_fail": dkim_fail,
        "dmarc_result_encoded": dmarc_encoded,
        "dmarc_result_pass": dmarc_pass,
        "dmarc_result_fail": dmarc_fail,
        "authentication_failure_count": auth_failures,
        "all_authentication_pass": all_auth_pass,
        "from_address_length": len(sender_email),
        "from_address_entropy": float(_calculate_entropy(sender_email)),
        "from_address_free_provider": 1 if from_domain in FREE_PROVIDERS else 0,
        "from_address_present": 1 if len(sender_email) > 0 else 0,
        "from_domain_length": len(from_domain),
        "from_domain_entropy": float(_calculate_entropy(from_domain)),
        "from_domain_free_provider": 1 if from_domain in FREE_PROVIDERS else 0,
        "from_domain_present": 1 if len(from_domain) > 0 else 0,
        "url_count": url_count,
        "has_url": has_url,
        "url_length_max": url_length_max,
        "url_length_avg": float(url_length_avg),
        "https_url_ratio": float(https_ratio),
        "ip_based_url_indicator": ip_based_url,
        "shortened_url_indicator": shortened_url,
        "has_attachments_present": has_attachments,
        "attachment_types_present": attachment_types_count,

        # Raw Text
        "raw_text_length": raw_text_stats["length"],
        "raw_text_word_count": raw_text_stats["word_count"],
        "raw_text_exclamation_count": raw_text_stats["exclamation_count"],
        "raw_text_uppercase_ratio": raw_text_stats["uppercase_ratio"],
        "raw_text_urgency_keyword_count": raw_text_stats["urgency_keyword_count"],
        "raw_text_credential_keyword_count": raw_text_stats["credential_keyword_count"],

        # Plain Body
        "body_plain_length": body_plain_stats["length"],
        "body_plain_word_count": body_plain_stats["word_count"],
        "body_plain_exclamation_count": body_plain_stats["exclamation_count"],
        "body_plain_uppercase_ratio": body_plain_stats["uppercase_ratio"],
        "body_plain_urgency_keyword_count": body_plain_stats["urgency_keyword_count"],
        "body_plain_credential_keyword_count": body_plain_stats["credential_keyword_count"],

        # HTML Body
        "body_html_length": body_html_stats["length"],
        "body_html_word_count": body_html_stats["word_count"],
        "body_html_exclamation_count": body_html_stats["exclamation_count"],
        "body_html_uppercase_ratio": body_html_stats["uppercase_ratio"],
        "body_html_urgency_keyword_count": body_html_stats["urgency_keyword_count"],
        "body_html_credential_keyword_count": body_html_stats["credential_keyword_count"],

        # Message ID
        "message_id_length": message_id_stats["length"],
        "message_id_word_count": message_id_stats["word_count"],
        "message_id_exclamation_count": message_id_stats["exclamation_count"],
        "message_id_uppercase_ratio": message_id_stats["uppercase_ratio"],
        "message_id_urgency_keyword_count": message_id_stats["urgency_keyword_count"],
        "message_id_credential_keyword_count": message_id_stats["credential_keyword_count"],

        # Emails in body
        "num_emails_in_body_length": emails_in_body_stats["length"],
        "num_emails_in_body_word_count": emails_in_body_stats["word_count"],
        "num_emails_in_body_exclamation_count": emails_in_body_stats["exclamation_count"],
        "num_emails_in_body_uppercase_ratio": emails_in_body_stats["uppercase_ratio"],
        "num_emails_in_body_urgency_keyword_count": emails_in_body_stats["urgency_keyword_count"],
        "num_emails_in_body_credential_keyword_count": emails_in_body_stats["credential_keyword_count"],

        # Subject
        "subject_length": subject_stats["length"],
        "subject_word_count": subject_stats["word_count"],
        "subject_exclamation_count": subject_stats["exclamation_count"],
        "subject_uppercase_ratio": subject_stats["uppercase_ratio"],
        "subject_urgency_keyword_count": subject_stats["urgency_keyword_count"],
        "subject_credential_keyword_count": subject_stats["credential_keyword_count"],
    }

    # Ensure all expected feature columns exist and are ordered correctly
    row = pd.DataFrame([feat_map])
    for col in feature_columns:
        if col not in row.columns:
            row[col] = 0

    return row[feature_columns]


def predict_email(email_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point to run Logistic Regression threat inference on email payload.
    Returns:
    {
        "prediction": "threat" | "safe",
        "probability": float (0.0 to 1.0),
        "risk_score": int (0 to 100)
    }
    """
    model, config = load_ml_model()
    if model is None or config is None:
        logger.warning("ML model unavailable — returning default safe prediction")
        return {"prediction": "safe", "probability": 0.0, "risk_score": 0}

    try:
        feature_columns = config.get("feature_columns", [])
        features_df = extract_features(email_data, feature_columns)

        logger.info(f"ML features extracted: {len(feature_columns)} columns")

        # Inference
        proba_arr = model.predict_proba(features_df)[0]
        probability = float(proba_arr[1])
        prediction = "threat" if probability >= 0.5 else "safe"
        risk_score = int(round(probability * 100))

        logger.info(f"ML prediction: {prediction}")
        logger.info(f"ML probability: {probability:.4f}")
        logger.info(f"ML risk score: {risk_score}")

        return {
            "prediction": prediction,
            "probability": probability,
            "risk_score": risk_score
        }
    except Exception as e:
        logger.error(f"Error during ML threat prediction: {e}")
        return {
            "prediction": "safe",
            "probability": 0.0,
            "risk_score": 0,
            "error": str(e)
        }
