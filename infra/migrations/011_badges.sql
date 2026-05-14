-- Feature #44: Badge System
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    criteria JSONB NOT NULL DEFAULT '{}'
);

-- Seed default badges
INSERT INTO badges (id, name, description, icon, category, criteria) VALUES
    ('first_scan', 'First Scan', 'Completed your first website scan', 'zap', 'milestone', '{"scans": 1}'),
    ('scanner_10', 'Scanner 10', 'Scanned 10 websites', 'target', 'milestone', '{"scans": 10}'),
    ('scanner_100', 'Century Scanner', 'Scanned 100 websites', 'award', 'milestone', '{"scans": 100}'),
    ('scanner_1000', 'Grand Scanner', 'Scanned 1000 websites', 'crown', 'milestone', '{"scans": 1000}'),
    ('vuln_hunter', 'Vulnerability Hunter', 'Found 10 vulnerabilities across scans', 'shield', 'skill', '{"vulns_found": 10}'),
    ('security_expert', 'Security Expert', 'Found 50 vulnerabilities across scans', 'shield-check', 'skill', '{"vulns_found": 50}'),
    ('community_star', 'Community Star', 'Received 50 likes on published scans', 'star', 'social', '{"likes_received": 50}'),
    ('trend_setter', 'Trend Setter', 'Published 10 scans to the feed', 'trending-up', 'social', '{"published": 10}'),
    ('collector', 'Collector', 'Created 5 collections', 'folder', 'social', '{"collections": 5}'),
    ('networker', 'Networker', 'Gained 10 followers', 'users', 'social', '{"followers": 10}')
ON CONFLICT (id) DO NOTHING;
