import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.schemas.threat import AlertModel
from app.database import db

logger = logging.getLogger("vaultshield.services.alerts")


def _safe_sort_key(obj: Any) -> float:
    """Extract float timestamp for safe datetime sorting."""
    val = getattr(obj, "created_at", None) if hasattr(obj, "created_at") else (obj.get("created_at") if isinstance(obj, dict) else obj)
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc).timestamp()
        return val.timestamp()
    if isinstance(val, str):
        try:
            dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.timestamp()
        except Exception:
            return 0.0
    return 0.0


class AlertService:
    @staticmethod
    def create_alert(
        user_id: str,
        title: str,
        message: str,
        severity: str = "medium",
        threat_id: Optional[str] = None,
        is_read: bool = False
    ) -> AlertModel:
        """
        Create a new persistent alert in both the in-memory store and Supabase alerts table.
        """
        alert_id = str(uuid.uuid4())
        now_dt = datetime.now(timezone.utc)

        # Normalize severity
        sev_norm = severity.lower() if severity else "medium"
        if sev_norm not in ["low", "medium", "high", "critical"]:
            sev_norm = "medium"

        alert = AlertModel(
            id=alert_id,
            user_id=user_id,
            threat_id=threat_id,
            title=title,
            message=message,
            severity=sev_norm,  # type: ignore
            is_read=is_read,
            created_at=now_dt
        )

        # 1. Store in memory
        db.store["alerts"][alert_id] = alert

        # 2. Persist to Supabase
        admin_client = db.get_admin_client()
        if admin_client:
            try:
                admin_client.table("alerts").insert({
                    "id": alert_id,
                    "user_id": user_id,
                    "threat_id": threat_id,
                    "title": title,
                    "message": message,
                    "severity": sev_norm,
                    "is_read": is_read,
                    "created_at": now_dt.isoformat()
                }).execute()
                logger.info(f"Inserted alert {alert_id} into Supabase for user {user_id}: {title}")
            except Exception as e:
                logger.warning(f"Supabase alert insert notice: {e}")

        return alert

    @staticmethod
    def get_alerts(user_id: str, is_investigator: bool = False) -> List[AlertModel]:
        """
        Fetch alerts for a user from in-memory cache, restoring from Supabase if cache is cold.
        """
        alerts: List[AlertModel] = []

        for a in list(db.store["alerts"].values()):
            if is_investigator or a.user_id == user_id:
                alerts.append(a)

        # If empty in memory, restore from Supabase
        if not alerts:
            admin_client = db.get_admin_client()
            if admin_client:
                try:
                    query = admin_client.table("alerts").select("*").order("created_at", desc=True)
                    if not is_investigator:
                        query = query.eq("user_id", user_id)
                    res = query.execute()
                    for row in (res.data or []):
                        try:
                            a_obj = AlertModel(
                                id=str(row["id"]),
                                user_id=str(row["user_id"]),
                                threat_id=str(row.get("threat_id")) if row.get("threat_id") else None,
                                title=row.get("title", "Security Notification"),
                                message=row.get("message", ""),
                                severity=row.get("severity", "medium"),
                                is_read=bool(row.get("is_read", False)),
                                created_at=row.get("created_at") or datetime.now(timezone.utc)
                            )
                            alerts.append(a_obj)
                            db.store["alerts"][a_obj.id] = a_obj
                        except Exception as parse_err:
                            logger.debug(f"Skipping malformed alert row: {parse_err}")
                except Exception as e:
                    logger.warning(f"Supabase alert retrieval warning: {e}")

        return sorted(alerts, key=_safe_sort_key, reverse=True)

    @staticmethod
    def mark_read(alert_id: str, user_id: Optional[str] = None) -> bool:
        """Mark alert as read in memory and Supabase."""
        alert = db.store["alerts"].get(alert_id)
        if alert:
            alert.is_read = True

        admin_client = db.get_admin_client()
        if admin_client:
            try:
                admin_client.table("alerts").update({
                    "is_read": True,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", alert_id).execute()
                return True
            except Exception as e:
                logger.debug(f"Supabase alert mark read notice: {e}")
        return bool(alert)

    @staticmethod
    def delete_alert(alert_id: str, user_id: Optional[str] = None) -> bool:
        """Delete an alert from memory and Supabase."""
        deleted_from_store = bool(db.store["alerts"].pop(alert_id, None))

        admin_client = db.get_admin_client()
        if admin_client:
            try:
                admin_client.table("alerts").delete().eq("id", alert_id).execute()
                logger.info(f"Deleted alert {alert_id} from Supabase.")
                return True
            except Exception as e:
                logger.debug(f"Supabase alert delete notice: {e}")
        return deleted_from_store

    @staticmethod
    def clear_all(user_id: str) -> bool:
        """Clear all alerts for a user from memory and Supabase."""
        # Remove from memory
        to_remove = [aid for aid, a in db.store["alerts"].items() if a.user_id == user_id]
        for aid in to_remove:
            db.store["alerts"].pop(aid, None)

        admin_client = db.get_admin_client()
        if admin_client:
            try:
                admin_client.table("alerts").delete().eq("user_id", user_id).execute()
                logger.info(f"Cleared all alerts for user {user_id} from Supabase.")
                return True
            except Exception as e:
                logger.debug(f"Supabase clear all alerts notice: {e}")
        return True


alert_service = AlertService()
