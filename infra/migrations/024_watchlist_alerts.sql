-- Watchlist alert delivery enhancements
ALTER TABLE watchlist_changes ADD COLUMN IF NOT EXISTS changes JSONB;
ALTER TABLE watchlist_changes ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE watchlists ADD COLUMN IF NOT EXISTS alert_discord_webhook TEXT DEFAULT '';
ALTER TABLE watchlists ADD COLUMN IF NOT EXISTS scan_interval_hours INTEGER DEFAULT 24;
