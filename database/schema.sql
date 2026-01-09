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
  proposal_path TEXT NULL, -- Made nullable for PR-only SIMDs
  proposal_sha TEXT,
  proposal_content TEXT,
  proposal_updated_at TIMESTAMPTZ NOT NULL,
  last_pr_activity_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft', -- SIMD-1 lifecycle status
  summary TEXT,
  topics JSONB,
  conclusion TEXT,
  -- Phase 2: lifecycle source tracking
  source_stage TEXT NOT NULL DEFAULT 'main', -- 'main', 'pr', or 'discussion'
  main_proposal_path TEXT NULL, -- Path in main/proposals/
  pr_proposal_path TEXT NULL, -- Path in PR
  github_discussion_url TEXT NULL, -- Discussion URL if applicable
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
  -- Phase 2: additional PR metadata
  html_url TEXT,
  head_sha TEXT NULL,
  base_ref TEXT NULL,
  head_ref TEXT NULL,
  last_commit_at TIMESTAMPTZ NULL, -- Last commit date on PR branch
  last_commit_sha TEXT NULL,
  participant_count INTEGER DEFAULT 0,
  reviewer_logins JSONB NULL, -- Array of reviewer login names
  proposal_file_path TEXT NULL, -- Path to proposal file in PR (e.g., proposals/XXXX-*.md)
  UNIQUE(simd_id, pr_number)
);

CREATE INDEX IF NOT EXISTS idx_simd_prs_simd_id ON simd_prs(simd_id);
CREATE INDEX IF NOT EXISTS idx_simd_prs_pr_number ON simd_prs(pr_number);
CREATE INDEX IF NOT EXISTS idx_simd_prs_updated_at ON simd_prs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_simd_prs_last_commit_at ON simd_prs(last_commit_at DESC);

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
  job_type TEXT NOT NULL, -- 'proposals', 'prs', 'messages', 'discussions'
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_started_at ON sync_jobs(started_at DESC);

-- Table: sync_state
-- Tracks incremental sync cursors and timestamps
CREATE TABLE IF NOT EXISTS sync_state (
  job_type TEXT PRIMARY KEY,
  last_success_at TIMESTAMPTZ,
  cursor TEXT NULL, -- For pagination (e.g., GraphQL endCursor)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: simd_discussions
-- Stores GitHub Discussions related to SIMDs
CREATE TABLE IF NOT EXISTS simd_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simd_id TEXT NULL REFERENCES simds(id) ON DELETE SET NULL,
  github_discussion_id TEXT UNIQUE NOT NULL,
  discussion_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  comment_count INTEGER DEFAULT 0,
  category_slug TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_simd_discussions_updated_at ON simd_discussions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_simd_discussions_simd_id ON simd_discussions(simd_id);

-- Table: simd_discussion_comments
-- Stores comments from GitHub Discussions
CREATE TABLE IF NOT EXISTS simd_discussion_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id UUID REFERENCES simd_discussions(id) ON DELETE CASCADE,
  github_comment_id TEXT UNIQUE NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  body TEXT,
  url TEXT
);

CREATE INDEX IF NOT EXISTS idx_simd_discussion_comments_discussion_id ON simd_discussion_comments(discussion_id);

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

-- Phase 2 Views: separate feeds for each lifecycle stage

-- View: merged_simds_feed
-- SIMDs that have been merged into main/proposals/
CREATE OR REPLACE VIEW merged_simds_feed AS
SELECT s.*, COUNT(DISTINCT m.id) as message_count
FROM simds s
LEFT JOIN simd_messages m ON s.id = m.simd_id
WHERE s.main_proposal_path IS NOT NULL OR s.proposal_path IS NOT NULL
GROUP BY s.id
ORDER BY s.proposal_updated_at DESC;

-- View: open_prs_feed
-- Open PRs for SIMD proposals, sorted by last commit date
CREATE OR REPLACE VIEW open_prs_feed AS
SELECT
  p.id as pr_id,
  p.pr_number,
  p.pr_title,
  p.html_url,
  p.last_commit_at,
  p.state,
  p.author,
  p.issue_comment_count + p.review_comment_count + COALESCE(p.review_count, 0) as total_comments,
  p.reviewer_logins,
  s.id as simd_id,
  s.title as simd_title,
  s.summary
FROM simd_prs p
LEFT JOIN simds s ON p.simd_id = s.id
WHERE p.state = 'open'
ORDER BY p.last_commit_at DESC NULLS LAST;

-- View: simd_discussions_feed
-- GitHub Discussions related to SIMDs, sorted by activity
CREATE OR REPLACE VIEW simd_discussions_feed AS
SELECT *
FROM simd_discussions
ORDER BY updated_at DESC;

-- Grant permissions (adjust as needed for your setup)
-- These are examples - modify based on your security requirements
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Sample query to test:
-- SELECT * FROM simds_with_counts ORDER BY last_activity_at DESC LIMIT 10;
