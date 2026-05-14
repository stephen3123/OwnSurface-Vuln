-- Historical scan data (never expires, used for trending/diff)
CREATE TABLE IF NOT EXISTS scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    result JSONB NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_history_url_hash ON scan_history(url_hash);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON scan_history(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_url_hash_time ON scan_history(url_hash, scanned_at DESC);
