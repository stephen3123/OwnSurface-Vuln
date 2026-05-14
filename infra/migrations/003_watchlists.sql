-- Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID,
    name TEXT NOT NULL,
    urls TEXT[] NOT NULL,
    check_interval INT DEFAULT 6,
    alert_email BOOLEAN DEFAULT true,
    alert_slack_webhook TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_team ON watchlists(team_id) WHERE team_id IS NOT NULL;

-- Watchlist change events
CREATE TABLE IF NOT EXISTS watchlist_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    change_type TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlist_changes_watchlist ON watchlist_changes(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_changes_detected ON watchlist_changes(detected_at DESC);
