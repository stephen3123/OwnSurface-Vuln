-- Migration 040: Brand mention monitoring

CREATE TABLE IF NOT EXISTS brand_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    title TEXT,
    body_snippet TEXT,
    author TEXT,
    subreddit TEXT,
    score INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    sentiment TEXT DEFAULT 'neutral',
    is_google_ranking BOOLEAN DEFAULT FALSE,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_url, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mentions_user ON brand_mentions(user_id, discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_domain ON brand_mentions(domain, discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_source ON brand_mentions(source);
CREATE INDEX IF NOT EXISTS idx_mentions_sentiment ON brand_mentions(sentiment);
