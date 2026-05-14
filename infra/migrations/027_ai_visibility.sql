-- Migration 027: AI visibility tables

CREATE TABLE IF NOT EXISTS ai_visibility_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    industry TEXT,
    overall_score INTEGER DEFAULT 0,
    models_checked INTEGER DEFAULT 0,
    models_mentioning INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_visibility_checks_domain ON ai_visibility_checks (domain, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_checks_user ON ai_visibility_checks (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_visibility_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id UUID NOT NULL REFERENCES ai_visibility_checks(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    model TEXT NOT NULL,
    brand_mentioned BOOLEAN DEFAULT FALSE,
    mention_context TEXT,
    mention_position INTEGER,
    competitor_mentions TEXT[] DEFAULT '{}',
    response_snippet TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_visibility_results_check ON ai_visibility_results (check_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_results_model ON ai_visibility_results (model);

CREATE TABLE IF NOT EXISTS ai_visibility_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry TEXT NOT NULL,
    query_template TEXT NOT NULL,
    query_type TEXT NOT NULL DEFAULT 'general'
);

CREATE INDEX IF NOT EXISTS idx_ai_visibility_queries_industry ON ai_visibility_queries (industry);

-- Seed industry query templates
INSERT INTO ai_visibility_queries (industry, query_template, query_type) VALUES
    ('saas', 'What are the best {industry} tools for businesses?', 'general'),
    ('saas', 'Can you recommend a good {brand_category} solution?', 'recommendation'),
    ('saas', 'How does {brand_name} compare to its competitors?', 'comparison'),
    ('saas', 'What do people think about {brand_name}?', 'review'),
    ('saas', 'What is the best alternative to {brand_name}?', 'comparison'),
    ('ecommerce', 'What are the best online stores for {brand_category}?', 'general'),
    ('ecommerce', 'Can you recommend a good {brand_category} website?', 'recommendation'),
    ('ecommerce', 'Is {brand_name} a reliable place to shop?', 'review'),
    ('ecommerce', 'What are alternatives to {brand_name}?', 'comparison'),
    ('technology', 'What are the leading {brand_category} companies?', 'general'),
    ('technology', 'Tell me about {brand_name} and what they do', 'general'),
    ('technology', 'What is the best {brand_category} platform?', 'recommendation'),
    ('technology', 'How does {brand_name} compare to competitors?', 'comparison'),
    ('technology', '{brand_name} reviews and reputation', 'review'),
    ('finance', 'What are the best {brand_category} services?', 'general'),
    ('finance', 'Is {brand_name} trustworthy?', 'review'),
    ('finance', 'Compare {brand_name} with alternatives', 'comparison'),
    ('healthcare', 'Best {brand_category} solutions for healthcare', 'general'),
    ('healthcare', 'What do experts say about {brand_name}?', 'review'),
    ('education', 'Best {brand_category} platforms for learning', 'general'),
    ('education', 'Is {brand_name} worth it for education?', 'review'),
    ('marketing', 'Best {brand_category} tools for marketing', 'general'),
    ('marketing', 'How does {brand_name} help with marketing?', 'recommendation'),
    ('marketing', '{brand_name} vs competitors for marketing', 'comparison'),
    ('security', 'What are the best cybersecurity {brand_category} tools?', 'general'),
    ('security', 'How reliable is {brand_name} for security?', 'review'),
    ('media', 'Best {brand_category} platforms for content', 'general'),
    ('media', 'What do people think of {brand_name}?', 'review'),
    ('general', 'What are the top companies in {brand_category}?', 'general'),
    ('general', 'Tell me about {brand_name}', 'general'),
    ('general', 'Is {brand_name} good? What are the reviews?', 'review'),
    ('general', 'What are alternatives to {brand_name}?', 'comparison'),
    ('general', 'Can you recommend something like {brand_name}?', 'recommendation'),
    ('general', 'How does {brand_name} compare to others in {brand_category}?', 'comparison'),
    ('general', 'What is {brand_name} known for?', 'general'),
    ('general', 'Best {brand_category} services available today', 'recommendation'),
    ('general', 'Who are the leaders in {brand_category}?', 'general'),
    ('general', 'Should I use {brand_name} or its competitors?', 'comparison'),
    ('general', '{brand_name} pros and cons', 'review')
ON CONFLICT DO NOTHING;
