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

    // Fetch all messages (excluding bot)
    const { data: allMessages, error: allMessagesError } = await supabase
      .from('simd_messages')
      .select('author, simd_id, created_at')
      .neq('author', 'simd-bot[bot]');

    if (allMessagesError) throw allMessagesError;

    // Fetch messages from last 7 days (excluding bot)
    const { data: recentMessages, error: recentMessagesError } = await supabase
      .from('simd_messages')
      .select('author, simd_id, created_at')
      .neq('author', 'simd-bot[bot]')
      .gte('created_at', sevenDaysAgoISO);

    if (recentMessagesError) throw recentMessagesError;

    // Get SIMD titles for enrichment
    const allSimdIds = [...new Set((allMessages || []).map(m => m.simd_id))];

    const { data: simds } = await supabase
      .from('simds')
      .select('id, title')
      .in('id', allSimdIds);

    const simdTitleMap = new Map((simds || []).map(s => [s.id, s.title]));

    // ========================================
    // TABLE 1: Top 5 People with Most Messages (Last 7 Days)
    // ========================================
    const messageCountLast7Days: Record<string, number> = {};
    for (const msg of (recentMessages || [])) {
      messageCountLast7Days[msg.author] = (messageCountLast7Days[msg.author] || 0) + 1;
    }
    const top5MessagesLast7Days = Object.entries(messageCountLast7Days)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author, count], idx) => ({ rank: idx + 1, author, messages: count }));

    // ========================================
    // TABLE 2: Top 5 People with Most Messages (All Time)
    // ========================================
    const messageCountAllTime: Record<string, number> = {};
    for (const msg of (allMessages || [])) {
      messageCountAllTime[msg.author] = (messageCountAllTime[msg.author] || 0) + 1;
    }
    const top5MessagesAllTime = Object.entries(messageCountAllTime)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author, count], idx) => ({ rank: idx + 1, author, messages: count }));

    // ========================================
    // TABLE 3: Top 5 People Who Discussed Most Different Proposals (Last 7 Days)
    // ========================================
    const proposalsPerPersonLast7Days: Record<string, Set<string>> = {};
    for (const msg of (recentMessages || [])) {
      if (!proposalsPerPersonLast7Days[msg.author]) {
        proposalsPerPersonLast7Days[msg.author] = new Set();
      }
      proposalsPerPersonLast7Days[msg.author].add(msg.simd_id);
    }
    const top5ProposalsLast7Days = Object.entries(proposalsPerPersonLast7Days)
      .map(([author, simdsSet]) => ({ author, proposalCount: simdsSet.size }))
      .sort((a, b) => b.proposalCount - a.proposalCount)
      .slice(0, 5)
      .map((item, idx) => ({ rank: idx + 1, ...item }));

    // ========================================
    // TABLE 4: Top 5 People Who Discussed Most Different Proposals (All Time)
    // ========================================
    const proposalsPerPersonAllTime: Record<string, Set<string>> = {};
    for (const msg of (allMessages || [])) {
      if (!proposalsPerPersonAllTime[msg.author]) {
        proposalsPerPersonAllTime[msg.author] = new Set();
      }
      proposalsPerPersonAllTime[msg.author].add(msg.simd_id);
    }
    const top5ProposalsAllTime = Object.entries(proposalsPerPersonAllTime)
      .map(([author, simdsSet]) => ({ author, proposalCount: simdsSet.size }))
      .sort((a, b) => b.proposalCount - a.proposalCount)
      .slice(0, 5)
      .map((item, idx) => ({ rank: idx + 1, ...item }));

    // ========================================
    // TABLE 5: SIMDs with Most Discussion Messages (All Time)
    // ========================================
    const messagesPerSimdAllTime: Record<string, number> = {};
    for (const msg of (allMessages || [])) {
      messagesPerSimdAllTime[msg.simd_id] = (messagesPerSimdAllTime[msg.simd_id] || 0) + 1;
    }
    const top5SimdsByMessagesAllTime = Object.entries(messagesPerSimdAllTime)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([simd_id, count], idx) => ({
        rank: idx + 1,
        simd_id,
        simd_title: simdTitleMap.get(simd_id) || `SIMD-${simd_id}`,
        total_messages: count,
      }));

    // ========================================
    // TABLE 6: SIMDs with Most Discussion Messages (Last 7 Days)
    // ========================================
    const messagesPerSimdLast7Days: Record<string, number> = {};
    for (const msg of (recentMessages || [])) {
      messagesPerSimdLast7Days[msg.simd_id] = (messagesPerSimdLast7Days[msg.simd_id] || 0) + 1;
    }
    const top5SimdsByMessagesLast7Days = Object.entries(messagesPerSimdLast7Days)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([simd_id, count], idx) => ({
        rank: idx + 1,
        simd_id,
        simd_title: simdTitleMap.get(simd_id) || `SIMD-${simd_id}`,
        total_messages: count,
      }));

    // Build markdown content
    let markdown = `# SIMD Community Stats Report\n\n`;
    markdown += `**Report Generated:** ${new Date().toLocaleString()}\n\n`;
    markdown += `**Data Range:** Last 7 days (${sevenDaysAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}) and All Time\n\n`;
    markdown += `---\n\n`;

    // TABLE 1
    markdown += `## 📊 Top 5 Most Active Contributors (Last 7 Days)\n\n`;
    markdown += `| Rank | Contributor | Messages |\n`;
    markdown += `|------|-------------|----------|\n`;
    if (top5MessagesLast7Days.length === 0) {
      markdown += `| - | *No messages in the last 7 days* | - |\n`;
    } else {
      for (const row of top5MessagesLast7Days) {
        markdown += `| ${row.rank} | ${row.author} | ${row.messages} |\n`;
      }
    }
    markdown += `\n`;

    // TABLE 2
    markdown += `## 📊 Top 5 Most Active Contributors (All Time)\n\n`;
    markdown += `| Rank | Contributor | Messages |\n`;
    markdown += `|------|-------------|----------|\n`;
    for (const row of top5MessagesAllTime) {
      markdown += `| ${row.rank} | ${row.author} | ${row.messages} |\n`;
    }
    markdown += `\n`;

    // TABLE 3
    markdown += `## 🌐 Top 5 Most Diverse Contributors (Last 7 Days)\n\n`;
    markdown += `*People who discussed the most different proposals*\n\n`;
    markdown += `| Rank | Contributor | Proposals Discussed |\n`;
    markdown += `|------|-------------|---------------------|\n`;
    if (top5ProposalsLast7Days.length === 0) {
      markdown += `| - | *No discussions in the last 7 days* | - |\n`;
    } else {
      for (const row of top5ProposalsLast7Days) {
        markdown += `| ${row.rank} | ${row.author} | ${row.proposalCount} |\n`;
      }
    }
    markdown += `\n`;

    // TABLE 4
    markdown += `## 🌐 Top 5 Most Diverse Contributors (All Time)\n\n`;
    markdown += `*People who discussed the most different proposals*\n\n`;
    markdown += `| Rank | Contributor | Proposals Discussed |\n`;
    markdown += `|------|-------------|---------------------|\n`;
    for (const row of top5ProposalsAllTime) {
      markdown += `| ${row.rank} | ${row.author} | ${row.proposalCount} |\n`;
    }
    markdown += `\n`;

    // TABLE 5
    markdown += `## 🔥 Most Discussed SIMDs (All Time)\n\n`;
    markdown += `| Rank | SIMD | Messages |\n`;
    markdown += `|------|------|-----------|\n`;
    for (const row of top5SimdsByMessagesAllTime) {
      markdown += `| ${row.rank} | SIMD-${row.simd_id}: ${row.simd_title} | ${row.total_messages} |\n`;
    }
    markdown += `\n`;

    // TABLE 6
    markdown += `## 🔥 Most Discussed SIMDs (Last 7 Days)\n\n`;
    markdown += `| Rank | SIMD | Messages |\n`;
    markdown += `|------|------|-----------|\n`;
    if (top5SimdsByMessagesLast7Days.length === 0) {
      markdown += `| - | *No discussions in the last 7 days* | - |\n`;
    } else {
      for (const row of top5SimdsByMessagesLast7Days) {
        markdown += `| ${row.rank} | SIMD-${row.simd_id}: ${row.simd_title} | ${row.total_messages} |\n`;
      }
    }
    markdown += `\n`;

    markdown += `---\n\n`;
    markdown += `## 📈 Quick Stats\n\n`;
    markdown += `- **Total Messages (All Time):** ${(allMessages || []).length}\n`;
    markdown += `- **Messages (Last 7 Days):** ${(recentMessages || []).length}\n`;
    markdown += `- **SIMDs Discussed (All Time):** ${Object.keys(messagesPerSimdAllTime).length}\n`;
    markdown += `- **Unique Contributors (All Time):** ${Object.keys(messageCountAllTime).length}\n`;
    markdown += `- **Active Contributors (Last 7 Days):** ${Object.keys(messageCountLast7Days).length}\n\n`;

    markdown += `---\n\n`;
    markdown += `*Generated on ${new Date().toLocaleString()}*\n`;
    markdown += `*Data sourced from: https://github.com/solana-foundation/solana-improvement-documents*\n`;

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="simd-stats-${new Date().toISOString().split('T')[0]}.md"`,
      },
    });

  } catch (error) {
    console.error('Error generating stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate stats', details: errorMessage },
      { status: 500 }
    );
  }
}
