import logging
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger("vaultshield.database")

class Database:
    def __init__(self):
        self.client: Optional[Client] = None
        self.admin_client: Optional[Client] = None
        self.is_connected: bool = False
        
        # High-performance In-Memory cache & data store fallback
        self.store = {
            "users": {},
            "gmail_accounts": {},
            "emails": {},
            "threats": {},
            "alerts": {},
            "investigations": {},
            "investigation_events": {},
            "reports": {},
            "ip_intelligence": {},
            "geolocations": {},
            # Tracks processed Gmail message IDs to prevent duplicate analysis
            # Key: f"{user_id}:{gmail_message_id}", Value: {status, severity, warning_sent}
            "processed_messages": {},
        }

    def initialize(self):
        """Initialize Supabase client and admin client."""
        try:
            if settings.SUPABASE_URL and settings.SUPABASE_SECRET_KEY:
                # Service role / secret key client for admin & server operations
                self.admin_client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SECRET_KEY
                )
                self.is_connected = True
                logger.info("Supabase Admin Client initialized successfully.")
            
            if settings.SUPABASE_URL and settings.SUPABASE_PUBLISHABLE_KEY:
                # Public / anon client
                self.client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_PUBLISHABLE_KEY
                )
                logger.info("Supabase Public Client initialized successfully.")
        except Exception as e:
            logger.warning(f"Supabase connection warning: {e}. Running with hybrid resilience.")
            self.is_connected = False

    def get_client(self) -> Optional[Client]:
        return self.admin_client or self.client

    def get_admin_client(self) -> Optional[Client]:
        return self.admin_client

db = Database()
db.initialize()
