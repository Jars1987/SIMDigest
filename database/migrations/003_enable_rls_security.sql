-- Migration 003: Enable Row Level Security and fix security definer views
-- This fixes Supabase security linter warnings

-- ============================================================================
-- PART 1: Enable RLS on all public tables
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.simds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simd_prs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simd_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simd_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simd_discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simd_pr_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Create RLS policies for public read-only data
-- ============================================================================

-- Public read access for SIMD data (these are public GitHub data)
CREATE POLICY "Public read access for simds"
  ON public.simds
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for simd_prs"
  ON public.simd_prs
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for simd_messages"
  ON public.simd_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for simd_discussions"
  ON public.simd_discussions
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for simd_discussion_comments"
  ON public.simd_discussion_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for simd_pr_summaries"
  ON public.simd_pr_summaries
  FOR SELECT
  USING (true);

-- ============================================================================
-- PART 3: Policies for subscriber management
-- ============================================================================

-- Anyone can insert a new subscriber (for signup form)
CREATE POLICY "Anyone can subscribe"
  ON public.subscribers
  FOR INSERT
  WITH CHECK (true);

-- Only service role can read/update/delete subscribers (admin access)
-- No public read access - protects subscriber emails

-- ============================================================================
-- PART 4: Policies for newsletter management
-- ============================================================================

-- Newsletter drafts and sends are admin-only (no public access)
-- Only service role can access these tables

-- ============================================================================
-- PART 5: Policies for sync operations
-- ============================================================================

-- Sync jobs and sync state are internal (no public access)
-- Only service role can access these tables

-- ============================================================================
-- PART 6: Policies for admin table
-- ============================================================================

-- Admin table is completely locked down (no public access)
-- Only service role can access this table

-- ============================================================================
-- PART 7: Recreate views WITHOUT security definer
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS public.merged_simds_feed;
DROP VIEW IF EXISTS public.simds_with_counts;
DROP VIEW IF EXISTS public.open_prs_feed;
DROP VIEW IF EXISTS public.simd_discussions_feed;
DROP VIEW IF EXISTS public.prs_needing_summaries;

-- Recreate views WITHOUT SECURITY DEFINER (use default SECURITY INVOKER)
-- This means views will run with the permissions of the user calling them

CREATE VIEW public.simds_with_counts AS
SELECT
  s.*,
  COALESCE(COUNT(m.id), 0) as message_count
FROM simds s
LEFT JOIN simd_messages m ON s.id = m.simd_id
GROUP BY s.id, s.slug, s.title, s.proposal_path, s.proposal_sha,
         s.proposal_content, s.proposal_updated_at, s.last_pr_activity_at,
         s.last_activity_at, s.status, s.summary, s.topics, s.conclusion,
         s.source_stage, s.main_proposal_path, s.pr_proposal_path,
         s.github_discussion_url;

CREATE VIEW public.merged_simds_feed AS
SELECT
  s.id,
  s.slug,
  s.title,
  s.proposal_path,
  s.proposal_sha,
  s.proposal_content,
  s.proposal_updated_at,
  s.last_pr_activity_at,
  s.last_activity_at,
  s.status,
  s.summary,
  s.topics,
  s.conclusion,
  s.source_stage,
  s.main_proposal_path,
  s.pr_proposal_path,
  s.github_discussion_url,
  COALESCE(COUNT(m.id), 0) as message_count
FROM simds s
LEFT JOIN simd_messages m ON s.id = m.simd_id
WHERE s.source_stage = 'main'
GROUP BY s.id, s.slug, s.title, s.proposal_path, s.proposal_sha,
         s.proposal_content, s.proposal_updated_at, s.last_pr_activity_at,
         s.last_activity_at, s.status, s.summary, s.topics, s.conclusion,
         s.source_stage, s.main_proposal_path, s.pr_proposal_path,
         s.github_discussion_url
ORDER BY s.last_activity_at DESC NULLS LAST;

CREATE VIEW public.open_prs_feed AS
SELECT
  pr.id as pr_id,
  pr.pr_number,
  pr.pr_title,
  pr.html_url,
  pr.last_commit_at,
  pr.state,
  pr.author,
  (pr.issue_comment_count + pr.review_comment_count) as total_comments,
  pr.reviewer_logins,
  s.id as simd_id,
  s.title as simd_title,
  ps.summary
FROM simd_prs pr
JOIN simds s ON pr.simd_id = s.id
LEFT JOIN simd_pr_summaries ps ON pr.simd_id = ps.simd_id AND pr.pr_number = ps.pr_number
WHERE pr.state = 'open'
ORDER BY pr.last_commit_at DESC NULLS LAST;

CREATE VIEW public.simd_discussions_feed AS
SELECT
  d.id,
  d.simd_id,
  d.github_discussion_id,
  d.discussion_number,
  d.title,
  d.url,
  d.author,
  d.created_at,
  d.updated_at,
  d.comment_count,
  d.category_slug
FROM simd_discussions d
ORDER BY d.updated_at DESC NULLS LAST;

CREATE VIEW public.prs_needing_summaries AS
SELECT DISTINCT
  pr.simd_id,
  pr.pr_number,
  pr.pr_title,
  COUNT(m.id) as message_count
FROM simd_prs pr
LEFT JOIN simd_messages m ON pr.simd_id = m.simd_id AND pr.pr_number = m.pr_number
LEFT JOIN simd_pr_summaries s ON pr.simd_id = s.simd_id AND pr.pr_number = s.pr_number
WHERE s.id IS NULL
  AND pr.state IN ('open', 'closed')
GROUP BY pr.simd_id, pr.pr_number, pr.pr_title
HAVING COUNT(m.id) > 5
ORDER BY message_count DESC;

-- ============================================================================
-- PART 8: Grant appropriate permissions
-- ============================================================================

-- Grant SELECT on public views to anon and authenticated roles
GRANT SELECT ON public.simds_with_counts TO anon, authenticated;
GRANT SELECT ON public.merged_simds_feed TO anon, authenticated;
GRANT SELECT ON public.open_prs_feed TO anon, authenticated;
GRANT SELECT ON public.simd_discussions_feed TO anon, authenticated;
GRANT SELECT ON public.prs_needing_summaries TO anon, authenticated;

-- Grant SELECT on public data tables to anon and authenticated roles
GRANT SELECT ON public.simds TO anon, authenticated;
GRANT SELECT ON public.simd_prs TO anon, authenticated;
GRANT SELECT ON public.simd_messages TO anon, authenticated;
GRANT SELECT ON public.simd_discussions TO anon, authenticated;
GRANT SELECT ON public.simd_discussion_comments TO anon, authenticated;
GRANT SELECT ON public.simd_pr_summaries TO anon, authenticated;

-- Grant INSERT on subscribers to anon (for signup)
GRANT INSERT ON public.subscribers TO anon, authenticated;

-- ============================================================================
-- DONE
-- ============================================================================

-- Migration complete
-- All tables now have RLS enabled
-- Public data is readable, sensitive data is protected
-- Views no longer use SECURITY DEFINER
