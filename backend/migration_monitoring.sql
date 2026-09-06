-- =============================================================================
-- CyberTrace Production Migration
-- gmail_accounts monitoring columns + processed_gmail_messages table
-- =============================================================================
-- SAFE TO RUN ON EXISTING SUPABASE DATABASE
-- Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS to protect existing data
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =============================================================================

-- STEP 1: Add all missing monitoring columns to gmail_accounts
-- These columns are required by the monitoring_service.py startup restore
-- and the Gmail auto-monitoring feature.
-- All have safe defaults so existing rows are unaffected.

ALTER TABLE public.gmail_accounts
    ADD COLUMN IF NOT EXISTS monitoring_active BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.gmail_accounts
    ADD COLUMN IF NOT EXISTS watch_expiry TIMESTAMPTZ;

ALTER TABLE public.gmail_accounts
    ADD COLUMN IF NOT EXISTS last_history_id TEXT;

ALTER TABLE public.gmail_accounts
    ADD COLUMN IF NOT EXISTS emails_auto_processed INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.gmail_accounts
    ADD COLUMN IF NOT EXISTS warnings_sent INTEGER NOT NULL DEFAULT 0;

-- STEP 2: Create the processed_gmail_messages table (deduplication guard)
-- Prevents the same Gmail message from being analyzed twice.
-- Required by monitoring_service.py: is_message_processed() and mark_message_done()

CREATE TABLE IF NOT EXISTS public.processed_gmail_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gmail_message_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    processing_status TEXT NOT NULL DEFAULT 'processing',
    threat_severity TEXT,
    warning_email_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(gmail_message_id, user_id)
);

-- STEP 3: Enable Row Level Security on the new table
ALTER TABLE public.processed_gmail_messages ENABLE ROW LEVEL SECURITY;

-- STEP 4: RLS Policy — service role bypass (backend uses service role key)
-- The backend authenticates with the Supabase service role key, which bypasses
-- RLS automatically. These policies allow authenticated users to read their own rows.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'processed_gmail_messages'
        AND policyname = 'Users can read their own processed messages'
    ) THEN
        CREATE POLICY "Users can read their own processed messages"
            ON public.processed_gmail_messages
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- STEP 5: Verify the columns now exist (sanity check query)
-- After running this migration, you should see monitoring_active in the results.
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gmail_accounts'
  AND column_name IN (
    'monitoring_active',
    'watch_expiry',
    'last_history_id',
    'emails_auto_processed',
    'warnings_sent',
    'is_connected',
    'auto_scan_enabled',
    'scan_limit'
  )
ORDER BY column_name;

-- Expected output: 8 rows, all columns present
-- monitoring_active | boolean | false | NO
-- =============================================================================
-- MIGRATION COMPLETE
-- After running: restart your Render service (Manual Deploy) to pick up the fix
-- =============================================================================