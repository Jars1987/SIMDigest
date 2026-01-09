export interface SIMD {
  id: string;
  slug: string;
  title: string;
  proposal_path: string | null; // Made nullable for PR-only SIMDs
  proposal_sha: string | null;
  proposal_content: string | null;
  proposal_updated_at: string;
  last_pr_activity_at: string | null;
  last_activity_at: string;
  // SIMD-1 lifecycle statuses
  status: 'Idea' | 'Draft' | 'Review' | 'Accepted' | 'Implemented' | 'Activated' | 'Living' | 'Stagnant' | 'Withdrawn';
  summary: string | null;
  topics: string[] | null;
  conclusion: string | null;
  // Phase 2: lifecycle source tracking
  source_stage: 'main' | 'pr' | 'discussion';
  main_proposal_path: string | null;
  pr_proposal_path: string | null;
  github_discussion_url: string | null;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
}

export interface SIMDMessage {
  id: string;
  simd_id: string;
  pr_number: number;
  type: 'comment' | 'review' | 'commit';
  author: string;
  created_at: string;
  body: string;
  url: string;
}

export interface SIMDPR {
  id: string;
  simd_id: string;
  pr_number: number;
  pr_title: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  issue_comment_count: number;
  review_comment_count: number;
  review_count: number;
  author: string | null;
  // Phase 2: additional PR metadata
  html_url: string | null;
  head_sha: string | null;
  base_ref: string | null;
  head_ref: string | null;
  last_commit_at: string | null; // Last commit date on PR branch
  last_commit_sha: string | null;
  participant_count: number;
  reviewer_logins: string[] | null; // Array of reviewer login names
  proposal_file_path: string | null; // Path to proposal file in PR
}

export interface Subscriber {
  email: string;
  created_at: string;
  verified: boolean;
}

// Phase 2: GitHub Discussions types
export interface SIMDDiscussion {
  id: string;
  simd_id: string | null;
  github_discussion_id: string;
  discussion_number: number;
  title: string;
  url: string;
  author: string | null;
  created_at: string;
  updated_at: string;
  comment_count: number;
  category_slug: string;
}

export interface SIMDDiscussionComment {
  id: string;
  discussion_id: string;
  github_comment_id: string;
  author: string | null;
  created_at: string;
  body: string | null;
  url: string | null;
}

// Phase 2: Feed view types for dashboard
export interface MergedSIMDFeed extends SIMD {
  message_count: number;
}

export interface OpenPRFeed {
  pr_id: string;
  pr_number: number;
  pr_title: string;
  html_url: string | null;
  last_commit_at: string | null;
  state: string;
  author: string | null;
  total_comments: number;
  reviewer_logins: string[] | null;
  simd_id: string;
  simd_title: string | null;
  summary: string | null;
}

export interface SIMDPRSummary {
  id: string;
  simd_id: string;
  pr_number: number;
  summary: string;
  message_count: number;
  last_message_at: string | null;
  generated_at: string;
  model: string;
}
