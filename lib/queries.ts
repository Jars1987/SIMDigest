import { supabase, isSupabaseConfigured } from './supabase';
import { SIMD, SIMDMessage, SIMDDiscussion, OpenPRFeed, SIMDPR, SIMDPRSummary } from '@/types';

export async function getAllSIMDs(): Promise<SIMD[]> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('simds_with_counts')
      .select('*')
      .order('last_activity_at', { ascending: false });

    if (error) throw error;

    return data.map((simd: any) => ({
      id: simd.id,
      slug: simd.slug,
      title: simd.title,
      proposal_path: simd.proposal_path,
      proposal_sha: simd.proposal_sha,
      proposal_content: simd.proposal_content,
      proposal_updated_at: simd.proposal_updated_at,
      last_pr_activity_at: simd.last_pr_activity_at,
      last_activity_at: simd.last_activity_at,
      status: simd.status,
      summary: simd.summary,
      topics: simd.topics,
      conclusion: simd.conclusion,
      source_stage: simd.source_stage,
      main_proposal_path: simd.main_proposal_path,
      pr_proposal_path: simd.pr_proposal_path,
      github_discussion_url: simd.github_discussion_url,
      message_count: parseInt(simd.message_count) || 0,
    }));
  } catch (error) {
    console.error('Error fetching SIMDs:', error);
    return [];
  }
}

export async function getSIMDById(id: string): Promise<SIMD | null> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Database not configured');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('simds_with_counts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      proposal_path: data.proposal_path,
      proposal_sha: data.proposal_sha,
      proposal_content: data.proposal_content,
      proposal_updated_at: data.proposal_updated_at,
      last_pr_activity_at: data.last_pr_activity_at,
      last_activity_at: data.last_activity_at,
      status: data.status,
      summary: data.summary,
      topics: data.topics,
      conclusion: data.conclusion,
      source_stage: data.source_stage,
      main_proposal_path: data.main_proposal_path,
      pr_proposal_path: data.pr_proposal_path,
      github_discussion_url: data.github_discussion_url,
      message_count: parseInt(data.message_count) || 0,
    };
  } catch (error) {
    console.error('Error fetching SIMD:', error);
    return null;
  }
}

export async function getSIMDMessages(simdId: string, limit = 5): Promise<SIMDMessage[]> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Database not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('simd_messages')
      .select('*')
      .eq('simd_id', simdId)
      .neq('author', 'simd-bot[bot]')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((msg: any) => ({
      id: msg.id,
      simd_id: msg.simd_id,
      pr_number: msg.pr_number,
      type: msg.type,
      author: msg.author,
      created_at: msg.created_at,
      body: msg.body,
      url: msg.url,
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function getProposalContent(simdId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Database not configured');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('simds')
      .select('proposal_content')
      .eq('id', simdId)
      .single();

    if (error) throw error;
    return data.proposal_content || null;
  } catch (error) {
    console.error('Error fetching proposal content:', error);
    return null;
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  // RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check format and length (max 254 characters per RFC)
  if (!emailRegex.test(email) || email.length > 254) {
    return false;
  }

  // Additional checks
  const [localPart, domain] = email.split('@');

  // Local part should not exceed 64 characters
  if (localPart.length > 64) {
    return false;
  }

  // Domain should have at least one dot and valid characters
  if (!domain || domain.length < 3 || !domain.includes('.')) {
    return false;
  }

  return true;
}

export async function subscribeEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
    };
  } catch (error) {
    console.error('Error subscribing email:', error);
    return {
      success: false,
      message: 'Failed to subscribe. Please try again later.',
    };
  }
}

// Phase 2: New query functions for 3-feed dashboard

export async function getMergedSIMDs(limit = 10): Promise<SIMD[]> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Database not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('merged_simds_feed')
      .select('*')
      .limit(limit);

    if (error) throw error;

    return data.map((simd: any) => ({
      id: simd.id,
      slug: simd.slug,
      title: simd.title,
      proposal_path: simd.proposal_path,
      proposal_sha: simd.proposal_sha,
      proposal_content: simd.proposal_content,
      proposal_updated_at: simd.proposal_updated_at,
      last_pr_activity_at: simd.last_pr_activity_at,
      last_activity_at: simd.last_activity_at,
      status: simd.status,
      summary: simd.summary,
      topics: simd.topics,
      conclusion: simd.conclusion,
      source_stage: simd.source_stage,
      main_proposal_path: simd.main_proposal_path,
      pr_proposal_path: simd.pr_proposal_path,
      github_discussion_url: simd.github_discussion_url,
      message_count: parseInt(simd.message_count) || 0,
    }));
  } catch (error) {
    console.error('Error fetching merged SIMDs:', error);
    return [];
  }
}

export async function getOpenProposalPRs(limit = 10): Promise<OpenPRFeed[]> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Database not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('open_prs_feed')
      .select('*')
      .limit(limit);

    if (error) throw error;

    return data.map((pr: any) => ({
      pr_id: pr.pr_id,
      pr_number: pr.pr_number,
      pr_title: pr.pr_title,
      html_url: pr.html_url,
      last_commit_at: pr.last_commit_at,
      state: pr.state,
      author: pr.author,
      total_comments: parseInt(pr.total_comments) || 0,
      reviewer_logins: typeof pr.reviewer_logins === 'string'
        ? JSON.parse(pr.reviewer_logins)
        : (pr.reviewer_logins || []),
      simd_id: pr.simd_id,
      simd_title: pr.simd_title,
      summary: pr.summary,
    }));
  } catch (error) {
    console.error('Error fetching open PRs:', error);
    return [];
  }
}

export async function getSIMDDiscussions(limit = 10): Promise<SIMDDiscussion[]> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Database not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('simd_discussions_feed')
      .select('*')
      .limit(limit);

    if (error) throw error;

    return data.map((discussion: any) => ({
      id: discussion.id,
      simd_id: discussion.simd_id,
      github_discussion_id: discussion.github_discussion_id,
      discussion_number: discussion.discussion_number,
      title: discussion.title,
      url: discussion.url,
      author: discussion.author,
      created_at: discussion.created_at,
      updated_at: discussion.updated_at,
      comment_count: discussion.comment_count,
      category_slug: discussion.category_slug,
    }));
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return [];
  }
}

export async function getSIMDPRs(simdId: string): Promise<SIMDPR[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('simd_prs')
      .select('*')
      .eq('simd_id', simdId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((pr: any) => ({
      id: pr.id,
      simd_id: pr.simd_id,
      pr_number: pr.pr_number,
      pr_title: pr.pr_title,
      state: pr.state,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged_at: pr.merged_at,
      closed_at: pr.closed_at,
      issue_comment_count: pr.issue_comment_count,
      review_comment_count: pr.review_comment_count,
      review_count: pr.review_count,
      author: pr.author,
      html_url: pr.html_url,
      head_sha: pr.head_sha,
      base_ref: pr.base_ref,
      head_ref: pr.head_ref,
      last_commit_at: pr.last_commit_at,
      last_commit_sha: pr.last_commit_sha,
      participant_count: pr.participant_count,
      reviewer_logins: typeof pr.reviewer_logins === 'string'
        ? JSON.parse(pr.reviewer_logins)
        : (pr.reviewer_logins || []),
      proposal_file_path: pr.proposal_file_path,
    }));
  } catch (error) {
    console.error('Error fetching SIMD PRs:', error);
    return [];
  }
}

export async function getSIMDReviewers(simdId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const prs = await getSIMDPRs(simdId);
    const allReviewers = new Set<string>();

    prs.forEach(pr => {
      if (pr.reviewer_logins && Array.isArray(pr.reviewer_logins)) {
        pr.reviewer_logins.forEach(login => allReviewers.add(login));
      }
    });

    return Array.from(allReviewers);
  } catch (error) {
    console.error('Error fetching SIMD reviewers:', error);
    return [];
  }
}

export async function getSIMDPRSummary(simdId: string, prNumber: number): Promise<SIMDPRSummary | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('simd_pr_summaries')
      .select('*')
      .eq('simd_id', simdId)
      .eq('pr_number', prNumber)
      .single();

    if (error) {
      // If no summary exists, return null instead of throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      simd_id: data.simd_id,
      pr_number: data.pr_number,
      summary: data.summary,
      message_count: data.message_count,
      last_message_at: data.last_message_at,
      generated_at: data.generated_at,
      model: data.model,
    };
  } catch (error) {
    console.error('Error fetching PR summary:', error);
    return null;
  }
}
