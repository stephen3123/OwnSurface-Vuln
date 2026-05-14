-- Migration 041: Thread opportunity discovery

CREATE TABLE IF NOT EXISTS thread_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    thread_url TEXT NOT NULL,
    title TEXT,
    subreddit TEXT,
    thread_type TEXT DEFAULT 'general',
    score INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    age_days INTEGER,
    is_google_ranking BOOLEAN DEFAULT FALSE,
    opportunity_score INTEGER DEFAULT 0,
    suggested_angle TEXT,
    status TEXT DEFAULT 'new',
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(thread_url, user_id)
);

CREATE INDEX IF NOT EXISTS idx_threads_user ON thread_opportunities(user_id, opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_threads_status ON thread_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_threads_domain ON thread_opportunities(domain, discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_platform ON thread_opportunities(platform);
