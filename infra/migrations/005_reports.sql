-- Shareable reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    url TEXT NOT NULL,
    title TEXT,
    scan_result JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    slug TEXT UNIQUE,
    views INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_slug ON reports(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_public ON reports(is_public) WHERE is_public = true;
