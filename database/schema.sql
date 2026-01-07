-- SIMD Tracker Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: simds
-- Stores all SIMD proposals with their metadata
CREATE TABLE IF NOT EXISTS simds (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  proposal_path TEXT NOT NULL,
  proposal_sha TEXT,
  proposal_content TEXT,
  proposal_updated_at TIMESTAMPTZ NOT NULL,
  last_pr_activity_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  summary TEXT,
  topics JSONB,
  conclusion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sorting by activity
CREATE INDEX IF NOT EXISTS idx_simds_last_activity ON simds(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_simds_status ON simds(status);

-- Table: simd_prs
-- Stores pull requests associated with SIMDs
CREATE TABLE IF NOT EXISTS simd_prs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simd_id TEXT NOT NULL REFERENCES simds(id) ON DELETE CASCADE,
  pr_number INTEGER NOT NULL,
  pr_title TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  merged_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  issue_comment_count INTEGER DEFAULT 0,
  review_comment_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  author TEXT,
  UNIQUE(simd_id, pr_number)
);

CREATE INDEX IF NOT EXISTS idx_simd_prs_simd_id ON simd_prs(simd_id);
CREATE INDEX IF NOT EXISTS idx_simd_prs_pr_number ON simd_prs(pr_number);
CREATE INDEX IF NOT EXISTS idx_simd_prs_updated_at ON simd_prs(updated_at DESC);

-- Table: simd_messages
-- Stores comments and discussion messages from GitHub
CREATE TABLE IF NOT EXISTS simd_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simd_id TEXT NOT NULL REFERENCES simds(id) ON DELETE CASCADE,
  pr_number INTEGER NOT NULL,
  github_id BIGINT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'comment', 'review', 'commit'
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  body TEXT,
  url TEXT NOT NULL,
  CONSTRAINT fk_simd_pr FOREIGN KEY (simd_id, pr_number)
    REFERENCES simd_prs(simd_id, pr_number) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_simd_messages_simd_id ON simd_messages(simd_id);
CREATE INDEX IF NOT EXISTS idx_simd_messages_created_at ON simd_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simd_messages_pr_number ON simd_messages(pr_number);

-- Table: subscribers
-- Stores newsletter subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_verified ON subscribers(verified);

-- Table: sync_jobs
-- Tracks sync job runs for monitoring
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type TEXT NOT NULL, -- 'proposals', 'prs', 'messages'
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_started_at ON sync_jobs(started_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_simds_updated_at
  BEFORE UPDATE ON simds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate message count for a SIMD
CREATE OR REPLACE FUNCTION get_simd_message_count(simd_id_param TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM simd_messages
  WHERE simd_id = simd_id_param;
$$ LANGUAGE sql;

-- View: simds_with_counts
-- Convenient view that includes message counts
CREATE OR REPLACE VIEW simds_with_counts AS
SELECT
  s.*,
  COUNT(DISTINCT m.id) as message_count,
  COUNT(DISTINCT p.id) as pr_count
FROM simds s
LEFT JOIN simd_messages m ON s.id = m.simd_id
LEFT JOIN simd_prs p ON s.id = p.simd_id
GROUP BY s.id;

-- Grant permissions (adjust as needed for your setup)
-- These are examples - modify based on your security requirements
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Sample query to test:
-- SELECT * FROM simds_with_counts ORDER BY last_activity_at DESC LIMIT 10;
