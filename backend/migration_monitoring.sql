-- Run this SQL in your Supabase SQL Editor to add automatic monitoring support
-- This is safe to run on existing databases (uses IF NOT EXISTS / IF EXISTS guards)

-- Add new monitoring columns to existing gmail_accounts table
ALTER TABLE public.gmail_accounts ADD COLUMN IF NOT EXISTS monitoring_active BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.gmail_accounts ADD COLUMN IF NOT EXISTS watch_expiry TIMESTAMPTZ;
ALTER TABLE public.gmail_accounts ADD COLUMN IF NOT EXISTS last_history_id TEXT;
ALTER TABLE public.gmail_accounts ADD COLUMN IF NOT EXISTS emails_auto_processed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.gmail_accounts ADD COLUMN IF NOT EXISTS warnings_sent INTEGER NOT NULL DEFAULT 0;

-- Create the processed_gmail_messages table for duplicate-prevention tracking
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

-- Enable RLS on the new table
ALTER TABLE public.processed_gmail_messages ENABLE ROW LEVEL SECURITY;

-- Done! The backend will now be able to track processed messages.
