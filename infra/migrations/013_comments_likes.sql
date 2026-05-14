-- Feature #43: Comments and Likes
CREATE TABLE IF NOT EXISTS scan_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    published_scan_id UUID NOT NULL REFERENCES published_scans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, published_scan_id)
);

CREATE TABLE IF NOT EXISTS scan_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    published_scan_id UUID NOT NULL REFERENCES published_scans(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES scan_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scan_comments_scan ON scan_comments(published_scan_id, created_at);
CREATE INDEX idx_scan_comments_parent ON scan_comments(parent_id);
