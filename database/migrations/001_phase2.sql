-- Migration 001: Phase 2 schema changes

-- 1. Make proposal_path nullable and add new columns to simds
ALTER TABLE simds ALTER COLUMN proposal_path DROP NOT NULL;
ALTER TABLE simds ADD COLUMN IF NOT EXISTS source_stage TEXT NOT NULL DEFAULT 'main';
ALTER TABLE simds ADD COLUMN IF NOT EXISTS main_proposal_path TEXT NULL;
ALTER TABLE simds ADD COLUMN IF NOT EXISTS pr_proposal_path TEXT NULL;
ALTER TABLE simds ADD COLUMN IF NOT EXISTS github_discussion_url TEXT NULL;

-- 2. Add new columns to simd_prs
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS html_url TEXT;
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS head_sha TEXT NULL;
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS base_ref TEXT NULL;
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS head_ref TEXT NULL;
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS last_commit_at TIMESTAMPTZ NULL;
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS last_commit_sha TEXT NULL;
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0;
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS reviewer_logins JSONB NULL;
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS proposal_file_path TEXT NULL;
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- 3. Create discussions tables
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

CREATE TABLE IF NOT EXISTS simd_discussion_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id UUID REFERENCES simd_discussions(id) ON DELETE CASCADE,
  github_comment_id TEXT UNIQUE NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  body TEXT,
  url TEXT
);

-- 4. Create sync_state table
CREATE TABLE IF NOT EXISTS sync_state (
  job_type TEXT PRIMARY KEY,
  last_success_at TIMESTAMPTZ,
  cursor TEXT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_simd_discussions_updated_at ON simd_discussions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_simd_discussions_simd_id ON simd_discussions(simd_id);
CREATE INDEX IF NOT EXISTS idx_simd_discussion_comments_discussion_id ON simd_discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_simd_prs_last_commit_at ON simd_prs(last_commit_at DESC);

-- 6. Create new views
CREATE OR REPLACE VIEW merged_simds_feed AS
SELECT s.*, COUNT(DISTINCT m.id) as message_count
FROM simds s
LEFT JOIN simd_messages m ON s.id = m.simd_id
WHERE s.main_proposal_path IS NOT NULL OR s.proposal_path IS NOT NULL
GROUP BY s.id
ORDER BY s.proposal_updated_at DESC;

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

CREATE OR REPLACE VIEW simd_discussions_feed AS
SELECT *
FROM simd_discussions
ORDER BY updated_at DESC;

-- 7. Data migration for existing rows: copy proposal_path to main_proposal_path
UPDATE simds
SET main_proposal_path = proposal_path,
    source_stage = 'main'
WHERE proposal_path IS NOT NULL;
