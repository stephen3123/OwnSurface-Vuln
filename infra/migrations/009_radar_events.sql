-- Radar events (trend detection)
CREATE TABLE IF NOT EXISTS radar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    technology TEXT,
    category TEXT,
    affected_urls TEXT[],
    count INT NOT NULL,
    details JSONB,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_events_type ON radar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_radar_events_detected ON radar_events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_events_tech ON radar_events(technology) WHERE technology IS NOT NULL;
