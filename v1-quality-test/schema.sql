-- Migration for TarkaX Lead Quality Test Harness
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    evidence_url TEXT NOT NULL,
    title TEXT,
    body TEXT,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    dedupe_hash TEXT UNIQUE NOT NULL,
    company_name TEXT,
    evidence_quote TEXT,
    pain_category TEXT,
    pain_severity INTEGER,
    urgency INTEGER,
    decision_maker_title TEXT,
    recommended_outreach_angle TEXT,
    confidence TEXT,
    confidence_reason TEXT,
    score INTEGER,
    score_breakdown JSONB,
    raw_gemini_json JSONB,
    status TEXT DEFAULT 'new',
    run_id TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by dedupe_hash
CREATE INDEX IF NOT EXISTS idx_leads_dedupe_hash ON leads(dedupe_hash);
