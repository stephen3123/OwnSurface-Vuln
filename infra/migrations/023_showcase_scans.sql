-- Showcase scans: pre-scanned popular websites displayed on the landing page
-- Cron job scans 100+ sites weekly and stores condensed results here
-- Public API endpoint serves random entries (no auth required)

CREATE TABLE IF NOT EXISTS showcase_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    tech_stack JSONB NOT NULL DEFAULT '[]',
    security_grade TEXT,
    security_score INTEGER,
    seo_score INTEGER,
    traffic_rank INTEGER,
    estimated_visits TEXT,
    company_name TEXT,
    company_industry TEXT,
    ai_summary TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_showcase_scans_domain ON showcase_scans (domain);
CREATE INDEX IF NOT EXISTS idx_showcase_scans_category ON showcase_scans (category);
CREATE INDEX IF NOT EXISTS idx_showcase_scans_scanned_at ON showcase_scans (scanned_at DESC);
