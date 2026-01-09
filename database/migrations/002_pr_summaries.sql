-- Migration 002: PR Discussion Summaries
-- Adds AI-generated summary caching for PR discussions

-- Create table to store AI-generated summaries
CREATE TABLE IF NOT EXISTS simd_pr_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simd_id VARCHAR(4) NOT NULL REFERENCES simds(id) ON DELETE CASCADE,
  pr_number INTEGER NOT NULL,
  summary TEXT NOT NULL,
  message_count INTEGER NOT NULL,  -- Number of messages that were summarized
  last_message_at TIMESTAMPTZ,      -- Timestamp of newest message when summary was generated
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model VARCHAR(50) DEFAULT 'gpt-5-mini',
  UNIQUE(simd_id, pr_number)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_simd_pr_summaries_simd_pr ON simd_pr_summaries(simd_id, pr_number);
CREATE INDEX IF NOT EXISTS idx_simd_pr_summaries_generated_at ON simd_pr_summaries(generated_at);

-- Add message tracking columns to simd_prs
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS total_message_count INTEGER DEFAULT 0;

-- Update existing PRs with message counts and timestamps from simd_messages
UPDATE simd_prs pr
SET
  total_message_count = COALESCE(
    (SELECT COUNT(*) FROM simd_messages WHERE simd_id = pr.simd_id AND pr_number = pr.pr_number),
    0
  ),
  last_message_at = COALESCE(
    (SELECT MAX(created_at) FROM simd_messages WHERE simd_id = pr.simd_id AND pr_number = pr.pr_number),
    pr.updated_at
  );

-- Create view for PRs needing summary generation
CREATE OR REPLACE VIEW prs_needing_summaries AS
SELECT
  pr.simd_id,
  pr.pr_number,
  pr.pr_title,
  pr.state,
  pr.total_message_count,
  pr.last_message_at,
  s.last_message_at as summary_last_message_at,
  s.generated_at as summary_generated_at,
  CASE
    WHEN s.id IS NULL THEN 'no_summary'
    WHEN pr.last_message_at > s.last_message_at THEN 'new_messages'
    WHEN pr.total_message_count != s.message_count THEN 'message_count_changed'
    ELSE 'up_to_date'
  END as summary_status
FROM simd_prs pr
LEFT JOIN simd_pr_summaries s ON pr.simd_id = s.simd_id AND pr.pr_number = s.pr_number
WHERE pr.state = 'open'
  AND pr.total_message_count > 0;

COMMENT ON VIEW prs_needing_summaries IS 'View to identify PRs that need summary generation or refresh';
