-- Feature #43: Social Feed (Published Scans)
CREATE TABLE IF NOT EXISTS published_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES scans(id),
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL,
    title TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_published_scans_user ON published_scans(user_id);
CREATE INDEX idx_published_scans_created ON published_scans(created_at DESC);
CREATE INDEX idx_published_scans_likes ON published_scans(likes_count DESC);
