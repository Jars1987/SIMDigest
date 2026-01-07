export interface SIMD {
  id: string;
  slug: string;
  title: string;
  proposal_path: string;
  proposal_sha: string | null;
  proposal_updated_at: string;
  last_pr_activity_at: string | null;
  last_activity_at: string;
  status: 'draft' | 'active' | 'merged' | 'implemented' | 'rejected';
  summary: string | null;
  topics: string[] | null;
  conclusion: string | null;
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
  updated_at: string;
  merged_at: string | null;
  issue_comment_count: number;
  review_comment_count: number;
  review_count: number;
}

export interface Subscriber {
  email: string;
  created_at: string;
  verified: boolean;
}
