-- Feature #47: Leaderboard and Achievements
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_scans INTEGER NOT NULL DEFAULT 0,
    total_published INTEGER NOT NULL DEFAULT 0,
    total_likes_received INTEGER NOT NULL DEFAULT 0,
    total_followers INTEGER NOT NULL DEFAULT 0,
    weekly_scans INTEGER NOT NULL DEFAULT 0,
    weekly_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badges(id),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_stats_weekly ON user_stats(weekly_scans DESC);
CREATE INDEX idx_user_stats_total ON user_stats(total_scans DESC);
CREATE INDEX idx_achievements_user ON achievements(user_id);
