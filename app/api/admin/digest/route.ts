import { NextResponse } from 'next/server';
import { sql } from '@/scripts/lib/db';
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
    const newProposals = await sql`
      SELECT id, title, status, summary, topics, proposal_updated_at, main_proposal_path
      FROM simds
      WHERE source_stage = 'main'
        AND proposal_updated_at >= ${sevenDaysAgoISO}
      ORDER BY proposal_updated_at DESC
    `;

    // Get PR activity (commits, reviews, comments) in the last 7 days
    const prActivity = await sql`
      SELECT
        p.simd_id,
        p.pr_number,
        p.pr_title,
        p.last_commit_at,
        p.total_comments,
        s.title as simd_title,
        s.summary
      FROM simd_prs p
      LEFT JOIN simds s ON p.simd_id = s.id
      WHERE p.state = 'open'
        AND p.last_commit_at >= ${sevenDaysAgoISO}
      ORDER BY p.last_commit_at DESC
    `;

    // Get discussion activity in the last 7 days
    const discussionActivity = await sql`
      SELECT
        id,
        simd_id,
        discussion_number,
        title,
        author,
        updated_at,
        comment_count,
        url
      FROM simd_discussions
      WHERE updated_at >= ${sevenDaysAgoISO}
      ORDER BY updated_at DESC
    `;

    // Get actual discussion messages from the last 7 days (excluding bot messages)
    const recentMessages = await sql`
      SELECT
        m.simd_id,
        m.pr_number,
        m.author,
        m.body,
        m.created_at,
        m.url,
        s.title as simd_title
      FROM simd_messages m
      LEFT JOIN simds s ON m.simd_id = s.id
      WHERE m.created_at >= ${sevenDaysAgoISO}
        AND m.author != 'simd-bot[bot]'
      ORDER BY m.simd_id, m.created_at DESC
    `;

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
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    );
  }
}
