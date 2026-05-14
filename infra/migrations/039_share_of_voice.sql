-- Migration 039: Share of voice tracking

CREATE TABLE IF NOT EXISTS ai_share_of_voice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    category TEXT NOT NULL,
    total_queries INTEGER DEFAULT 0,
    brand_mentioned_count INTEGER DEFAULT 0,
    share_percentage DOUBLE PRECISION DEFAULT 0,
    top_competitors JSONB DEFAULT '[]',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sov_domain ON ai_share_of_voice(domain, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_sov_user ON ai_share_of_voice(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sov_period ON ai_share_of_voice(period_start, period_end);
