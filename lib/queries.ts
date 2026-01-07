import { supabase, isSupabaseConfigured } from './supabase';
import { mockSIMDs, mockMessages } from './mockData';
import { SIMD, SIMDMessage } from '@/types';

export async function getAllSIMDs(): Promise<SIMD[]> {
  if (!isSupabaseConfigured()) {
    console.log('📦 Using mock data (Supabase not configured)');
    return mockSIMDs;
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
      proposal_updated_at: simd.proposal_updated_at,
      last_pr_activity_at: simd.last_pr_activity_at,
      last_activity_at: simd.last_activity_at,
      status: simd.status,
      summary: simd.summary,
      topics: simd.topics,
      conclusion: simd.conclusion,
      message_count: parseInt(simd.message_count) || 0,
    }));
  } catch (error) {
    console.error('Error fetching SIMDs:', error);
    return mockSIMDs;
  }
}

export async function getSIMDById(id: string): Promise<SIMD | null> {
  if (!isSupabaseConfigured()) {
    return mockSIMDs.find((s) => s.id === id) || null;
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
      proposal_updated_at: data.proposal_updated_at,
      last_pr_activity_at: data.last_pr_activity_at,
      last_activity_at: data.last_activity_at,
      status: data.status,
      summary: data.summary,
      topics: data.topics,
      conclusion: data.conclusion,
      message_count: parseInt(data.message_count) || 0,
    };
  } catch (error) {
    console.error('Error fetching SIMD:', error);
    return mockSIMDs.find((s) => s.id === id) || null;
  }
}

export async function getSIMDMessages(simdId: string, limit = 5): Promise<SIMDMessage[]> {
  if (!isSupabaseConfigured()) {
    return mockMessages[simdId] || [];
  }

  try {
    const { data, error } = await supabase
      .from('simd_messages')
      .select('*')
      .eq('simd_id', simdId)
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
    return mockMessages[simdId] || [];
  }
}

export async function getProposalContent(simdId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    const { mockProposalContent } = await import('./mockData');
    return mockProposalContent;
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
    const { mockProposalContent } = await import('./mockData');
    return mockProposalContent;
  }
}

export async function subscribeEmail(email: string): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Database not configured',
    };
  }

  try {
    const { error } = await supabase
      .from('subscribers')
      .insert([{ email, verified: false }]);

    if (error) {
      if (error.code === '23505') {
        // Duplicate email
        return {
          success: false,
          message: 'This email is already subscribed',
        };
      }
      throw error;
    }

    return {
      success: true,
      message: 'Successfully subscribed! Check your email to confirm.',
    };
  } catch (error) {
    console.error('Error subscribing email:', error);
    return {
      success: false,
      message: 'Failed to subscribe. Please try again later.',
    };
  }
}
