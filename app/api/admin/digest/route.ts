import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Get new proposals merged in the last 7 days
    const { data: newProposals, error: proposalsError } = await supabase
      .from('simds')
      .select('id, title, status, summary, topics, proposal_updated_at, main_proposal_path')
      .eq('source_stage', 'main')
      .gte('proposal_updated_at', sevenDaysAgoISO)
      .order('proposal_updated_at', { ascending: false });

    if (proposalsError) throw proposalsError;

    // Get PR activity (commits, reviews, comments) in the last 7 days
    // Note: Supabase doesn't support JOINs directly, so we fetch PRs and enrich with SIMD data
    const { data: prActivityRaw, error: prError } = await supabase
      .from('simd_prs')
      .select('simd_id, pr_number, pr_title, last_commit_at, issue_comment_count, review_comment_count')
      .eq('state', 'open')
      .gte('last_commit_at', sevenDaysAgoISO)
      .order('last_commit_at', { ascending: false });

    if (prError) throw prError;

    // Enrich PR data with SIMD titles
    const prActivity = await Promise.all(
      (prActivityRaw || []).map(async (pr) => {
        const { data: simd } = await supabase
          .from('simds')
          .select('title, summary')
          .eq('id', pr.simd_id)
          .single();
        return {
          ...pr,
          total_comments: (pr.issue_comment_count || 0) + (pr.review_comment_count || 0),
          simd_title: simd?.title || null,
          summary: simd?.summary || null,
        };
      })
    );

    // Get discussion activity in the last 7 days
    const { data: discussionActivity, error: discussionError } = await supabase
      .from('simd_discussions')
      .select('id, simd_id, discussion_number, title, author, updated_at, comment_count, url')
      .gte('updated_at', sevenDaysAgoISO)
      .order('updated_at', { ascending: false });

    if (discussionError) throw discussionError;

    // Get actual discussion messages from the last 7 days (excluding bot messages)
    const { data: messagesRaw, error: messagesError } = await supabase
      .from('simd_messages')
      .select('simd_id, pr_number, author, body, created_at, url')
      .gte('created_at', sevenDaysAgoISO)
      .neq('author', 'simd-bot[bot]')
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    // Enrich messages with SIMD titles
    const simdIds = [...new Set((messagesRaw || []).map(m => m.simd_id))];
    const { data: simdsForMessages } = await supabase
      .from('simds')
      .select('id, title')
      .in('id', simdIds);

    const simdTitleMap = new Map((simdsForMessages || []).map(s => [s.id, s.title]));
    const recentMessages = (messagesRaw || []).map(m => ({
      ...m,
      simd_title: simdTitleMap.get(m.simd_id) || null,
    }));

    // Build markdown content
    let markdown = `# SIMD Digest - 7 Day Activity Report\n\n`;
    markdown += `**Report Period:** ${sevenDaysAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}\n\n`;
    markdown += `---\n\n`;

    // Section 1: New Proposals Merged
    markdown += `## 🎉 New Proposals Merged (${newProposals.length})\n\n`;

    if (newProposals.length === 0) {
      markdown += `*No new proposals were merged in the last 7 days.*\n\n`;
    } else {
      for (const proposal of newProposals) {
        markdown += `### SIMD-${proposal.id}: ${proposal.title}\n\n`;
        markdown += `- **Status:** ${proposal.status}\n`;
        markdown += `- **Updated:** ${new Date(proposal.proposal_updated_at).toLocaleDateString()}\n`;

        if (proposal.topics && proposal.topics.length > 0) {
          const topics = typeof proposal.topics === 'string'
            ? JSON.parse(proposal.topics)
            : proposal.topics;
          markdown += `- **Topics:** ${topics.join(', ')}\n`;
        }

        if (proposal.summary) {
          markdown += `- **Summary:** ${proposal.summary}\n`;
        }

        markdown += `- **Link:** [View SIMD-${proposal.id}](https://github.com/solana-foundation/solana-improvement-documents/blob/main/${proposal.main_proposal_path})\n\n`;
      }
    }

    markdown += `---\n\n`;

    // Section 2: Active Proposal PRs (Recent Commits)
    markdown += `## 🔄 Active Proposal PRs - Recent Activity (${prActivity.length})\n\n`;

    if (prActivity.length === 0) {
      markdown += `*No PR activity in the last 7 days.*\n\n`;
    } else {
      for (const pr of prActivity) {
        markdown += `### SIMD-${pr.simd_id}: ${pr.simd_title || pr.pr_title}\n\n`;
        markdown += `- **PR #${pr.pr_number}:** ${pr.pr_title}\n`;
        markdown += `- **Last Commit:** ${new Date(pr.last_commit_at).toLocaleDateString()}\n`;
        markdown += `- **Comments:** ${pr.total_comments}\n`;

        if (pr.summary) {
          markdown += `- **Summary:** ${pr.summary}\n`;
        }

        markdown += `- **Link:** [View PR #${pr.pr_number}](https://github.com/solana-foundation/solana-improvement-documents/pull/${pr.pr_number})\n\n`;
      }
    }

    markdown += `---\n\n`;

    // Section 3: Recent Discussion Messages (actual content)
    markdown += `## 🗣️ Recent Discussion Messages\n\n`;

    if (recentMessages.length === 0) {
      markdown += `*No discussion messages in the last 7 days.*\n\n`;
    } else {
      // Group messages by SIMD
      interface DigestMessage {
        simd_id: string;
        pr_number: number;
        author: string;
        body: string;
        created_at: string;
        url: string;
        simd_title: string | null;
      }
      const messagesBySIMD: Record<string, DigestMessage[]> = {};
      for (const msg of recentMessages) {
        const key = msg.simd_id;
        if (!messagesBySIMD[key]) {
          messagesBySIMD[key] = [];
        }
        messagesBySIMD[key].push(msg as DigestMessage);
      }

      for (const [simdId, messages] of Object.entries(messagesBySIMD)) {
        const simdTitle = messages[0]?.simd_title || `SIMD-${simdId}`;
        markdown += `### SIMD-${simdId}: ${simdTitle}\n\n`;

        // Show up to 5 most recent messages per SIMD
        const displayMessages = messages.slice(0, 5);
        for (const msg of displayMessages) {
          const date = new Date(msg.created_at).toLocaleDateString();
          // Truncate long messages to ~300 chars
          const body = msg.body.length > 300
            ? msg.body.substring(0, 300).trim() + '...'
            : msg.body;
          // Clean up the body - remove excessive newlines
          const cleanBody = body.replace(/\n{3,}/g, '\n\n').trim();

          markdown += `**${msg.author}** (${date}):\n`;
          markdown += `> ${cleanBody.replace(/\n/g, '\n> ')}\n\n`;
          markdown += `[View on GitHub](${msg.url})\n\n`;
        }

        if (messages.length > 5) {
          markdown += `*... and ${messages.length - 5} more messages*\n\n`;
        }

        markdown += `---\n\n`;
      }
    }

    // Section 4: Discussion Activity (GitHub Discussions)
    markdown += `## 💬 GitHub Discussions Activity (${discussionActivity.length})\n\n`;

    if (discussionActivity.length === 0) {
      markdown += `*No discussion activity in the last 7 days.*\n\n`;
    } else {
      for (const discussion of discussionActivity) {
        markdown += `### ${discussion.title}\n\n`;

        if (discussion.simd_id) {
          markdown += `- **Related SIMD:** SIMD-${discussion.simd_id}\n`;
        }

        markdown += `- **Discussion #${discussion.discussion_number}**\n`;
        markdown += `- **Author:** ${discussion.author}\n`;
        markdown += `- **Updated:** ${new Date(discussion.updated_at).toLocaleDateString()}\n`;
        markdown += `- **Comments:** ${discussion.comment_count}\n`;
        markdown += `- **Link:** [View Discussion](${discussion.url})\n\n`;
      }
    }

    markdown += `---\n\n`;

    // Section 5: Summary Stats
    markdown += `## 📊 Summary Statistics\n\n`;
    markdown += `- **New Proposals Merged:** ${newProposals.length}\n`;
    markdown += `- **Active PRs with Updates:** ${prActivity.length}\n`;
    markdown += `- **Discussion Messages:** ${recentMessages.length}\n`;
    markdown += `- **GitHub Discussions:** ${discussionActivity.length}\n`;
    markdown += `- **Total Activity Items:** ${newProposals.length + prActivity.length + recentMessages.length + discussionActivity.length}\n\n`;

    markdown += `---\n\n`;
    markdown += `*Generated on ${new Date().toLocaleString()}*\n`;
    markdown += `*Data sourced from: https://github.com/solana-foundation/solana-improvement-documents*\n`;

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="simd-digest-7day-${new Date().toISOString().split('T')[0]}.md"`,
      },
    });

  } catch (error) {
    console.error('Error generating digest:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate digest', details: errorMessage },
      { status: 500 }
    );
  }
}
