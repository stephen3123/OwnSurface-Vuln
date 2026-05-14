-- Scans table (cached scan results)
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    result JSONB NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_scans_url_hash ON scans(url_hash);
CREATE INDEX IF NOT EXISTS idx_scans_expires ON scans(expires_at);
CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at DESC);
