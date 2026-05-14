CREATE TABLE IF NOT EXISTS deep_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    verification_id UUID NOT NULL REFERENCES domain_verifications(id),
    status TEXT NOT NULL DEFAULT 'pending',
    pages_found INTEGER NOT NULL DEFAULT 0,
    pages_scanned INTEGER NOT NULL DEFAULT 0,
    max_pages INTEGER NOT NULL DEFAULT 500,
    results JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_deep_scans_user ON deep_scans(user_id);
CREATE INDEX idx_deep_scans_domain ON deep_scans(domain);
