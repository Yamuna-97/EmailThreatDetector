-- ==============================================================================
-- SIH 2026: AI Email Threat Detection, GeoLocation & Forensic Intelligence Platform
-- Supabase PostgreSQL Schema & Security Policies (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'investigator', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'user',
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. GMAIL ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.gmail_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_address TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMPTZ,
    scope TEXT,
    is_connected BOOLEAN NOT NULL DEFAULT true,
    auto_scan_enabled BOOLEAN NOT NULL DEFAULT false,
    scan_limit INTEGER NOT NULL DEFAULT 10,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, email_address)
);

-- 3. EMAILS TABLE
CREATE TABLE IF NOT EXISTS public.emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    thread_id TEXT,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    cc TEXT,
    bcc TEXT,
    subject TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snippet TEXT,
    plain_text_body TEXT,
    html_body TEXT,
    labels JSONB DEFAULT '[]'::jsonb,
    raw_headers JSONB DEFAULT '{}'::jsonb,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EMAIL HEADERS & AUTHENTICATION
CREATE TABLE IF NOT EXISTS public.email_headers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    from_header TEXT,
    to_header TEXT,
    reply_to TEXT,
    return_path TEXT,
    received_headers JSONB DEFAULT '[]'::jsonb,
    auth_results TEXT,
    spf TEXT,
    dkim TEXT,
    dmarc TEXT,
    source_ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EMAIL URLS
CREATE TABLE IF NOT EXISTS public.email_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    domain TEXT,
    protocol TEXT,
    hostname TEXT,
    path TEXT,
    is_ip_based BOOLEAN DEFAULT false,
    is_shortener BOOLEAN DEFAULT false,
    is_punycode BOOLEAN DEFAULT false,
    risk_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. EMAIL ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.email_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    is_suspicious BOOLEAN DEFAULT false,
    risk_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. IP INTELLIGENCE TABLE (Cached)
CREATE TABLE IF NOT EXISTS public.ip_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip TEXT UNIQUE NOT NULL,
    is_private BOOLEAN DEFAULT false,
    fraud_score INTEGER DEFAULT 0,
    is_vpn BOOLEAN DEFAULT false,
    is_proxy BOOLEAN DEFAULT false,
    is_tor BOOLEAN DEFAULT false,
    is_bot BOOLEAN DEFAULT false,
    isp TEXT,
    asn TEXT,
    organization TEXT,
    country_code TEXT,
    country_name TEXT,
    city TEXT,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. GEOLOCATION TABLE (Cached)
CREATE TABLE IF NOT EXISTS public.geolocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip TEXT UNIQUE NOT NULL,
    country TEXT,
    country_code TEXT,
    region TEXT,
    city TEXT,
    latitude FLOAT,
    longitude FLOAT,
    timezone TEXT,
    isp TEXT,
    asn TEXT,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. THREAT ANALYSES (Gemini + Threat Engine)
CREATE TABLE IF NOT EXISTS public.threat_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    classification TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ai_risk_score INTEGER NOT NULL,
    final_risk_score INTEGER NOT NULL,
    confidence FLOAT NOT NULL,
    summary TEXT NOT NULL,
    indicators JSONB DEFAULT '[]'::jsonb,
    observed_evidence JSONB DEFAULT '{}'::jsonb,
    ai_inferences JSONB DEFAULT '{}'::jsonb,
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. THREATS TABLE (Primary Security Incidents)
CREATE TABLE IF NOT EXISTS public.threats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    threat_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    confidence FLOAT NOT NULL DEFAULT 0.9,
    summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'confirmed', 'false_positive', 'resolved')),
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    threat_id UUID REFERENCES public.threats(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. INVESTIGATIONS TABLE
CREATE TABLE IF NOT EXISTS public.investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_id UUID NOT NULL REFERENCES public.threats(id) ON DELETE CASCADE,
    investigator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    notes TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. INVESTIGATION TIMELINE EVENTS
CREATE TABLE IF NOT EXISTS public.investigation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_id UUID NOT NULL REFERENCES public.threats(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. FORENSIC REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_id UUID NOT NULL REFERENCES public.threats(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    report_title TEXT NOT NULL,
    summary TEXT NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
