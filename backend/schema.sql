-- Run in Supabase SQL Editor (PostgreSQL)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(100) UNIQUE NOT NULL,
  prospect_name VARCHAR(255),
  phone_number VARCHAR(20),
  company VARCHAR(255),
  score INT DEFAULT 0,
  qualified VARCHAR(20) DEFAULT 'PENDING',
  framework VARCHAR(10) DEFAULT 'BANT',
  budget VARCHAR(200),
  authority VARCHAR(100),
  need TEXT,
  timeline VARCHAR(100),
  call_transcript TEXT,
  cdr_json JSONB,
  crm_pushed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_logs (
  id SERIAL PRIMARY KEY,
  call_id VARCHAR(100) UNIQUE NOT NULL,
  lead_id VARCHAR(100) NOT NULL REFERENCES leads(lead_id),
  phone_number VARCHAR(20),
  duration_seconds INT DEFAULT 0,
  recording_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scoring_details (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(100) NOT NULL REFERENCES leads(lead_id),
  framework VARCHAR(10),
  budget_score INT,
  authority_score INT,
  need_score INT,
  timeline_score INT,
  total_score INT,
  qualified VARCHAR(20),
  scored_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_turns (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(100) NOT NULL REFERENCES leads(lead_id),
  turn_number INT,
  role VARCHAR(10),
  text TEXT,
  extracted_data JSONB,
  turn_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_qualified ON leads(qualified);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
