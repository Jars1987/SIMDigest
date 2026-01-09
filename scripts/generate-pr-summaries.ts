#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';
import { generateDiscussionSummary } from '../lib/openai';

interface PRNeedingSummary {
  simd_id: string;
  pr_number: number;
  pr_title: string;
  state: string;
  total_message_count: number;
  last_message_at: string;
  summary_last_message_at: string | null;
  summary_generated_at: string | null;
  summary_status: string;
}

interface SIMDMessage {
  author: string;
  body: string;
  created_at: string;
}

async function generatePRSummaries() {
  console.log('\n🤖 Starting PR Summary Generation...\n');

  await testConnection();

  try {
    // Get PRs that need summaries (no summary, or new messages in last 6 hours)
    const prsNeedingSummaries = await sql<PRNeedingSummary[]>`
      SELECT *
      FROM prs_needing_summaries
      WHERE summary_status IN ('no_summary', 'new_messages', 'message_count_changed')
        OR (
          summary_status = 'up_to_date'
          AND summary_generated_at < NOW() - INTERVAL '6 hours'
          AND last_message_at > NOW() - INTERVAL '6 hours'
        )
      ORDER BY last_message_at DESC
      LIMIT 50
    `;

    console.log(`📊 Found ${prsNeedingSummaries.length} PRs needing summary generation\n`);

    if (prsNeedingSummaries.length === 0) {
      console.log('✅ All summaries are up to date!\n');
      return;
    }

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const pr of prsNeedingSummaries) {
      try {
        console.log(`   Processing SIMD-${pr.simd_id} PR #${pr.pr_number}: ${pr.pr_title.substring(0, 50)}...`);

        // Check if there's an existing summary
        const existingSummaryRow = await sql`
          SELECT summary, last_message_at
          FROM simd_pr_summaries
          WHERE simd_id = ${pr.simd_id} AND pr_number = ${pr.pr_number}
        `;

        const existingSummary = existingSummaryRow.length > 0 ? existingSummaryRow[0].summary : null;
        const lastSummaryMessageDate = existingSummaryRow.length > 0 ? existingSummaryRow[0].last_message_at : null;

        // Fetch messages - if we have existing summary, only fetch NEW messages
        let messages: SIMDMessage[];
        if (existingSummary && lastSummaryMessageDate) {
          // Fetch only messages created after the last summary
          messages = await sql<SIMDMessage[]>`
            SELECT author, body, created_at
            FROM simd_messages
            WHERE simd_id = ${pr.simd_id}
              AND pr_number = ${pr.pr_number}
              AND created_at > ${lastSummaryMessageDate}
            ORDER BY created_at ASC
          `;

          if (messages.length === 0) {
            console.log(`   ⏭️  Skipping - no new messages since last summary`);
            skipped++;
            continue;
          }

          console.log(`   🤖 Updating summary with ${messages.length} new messages (incremental)...`);
        } else {
          // First-time summary: fetch all messages
          messages = await sql<SIMDMessage[]>`
            SELECT author, body, created_at
            FROM simd_messages
            WHERE simd_id = ${pr.simd_id} AND pr_number = ${pr.pr_number}
            ORDER BY created_at ASC
          `;

          if (messages.length === 0) {
            console.log(`   ⏭️  Skipping - no messages found`);
            skipped++;
            continue;
          }

          console.log(`   🤖 Generating initial summary for ${messages.length} messages...`);
        }

        // Generate or update summary using OpenAI (pass existing summary for incremental updates)
        const summary = await generateDiscussionSummary(messages, existingSummary);

        // Store summary in database
        await sql`
          INSERT INTO simd_pr_summaries (
            simd_id,
            pr_number,
            summary,
            message_count,
            last_message_at,
            generated_at,
            model
          ) VALUES (
            ${pr.simd_id},
            ${pr.pr_number},
            ${summary},
            ${messages.length},
            ${pr.last_message_at},
            NOW(),
            'gpt-5-mini'
          )
          ON CONFLICT (simd_id, pr_number) DO UPDATE SET
            summary = EXCLUDED.summary,
            message_count = EXCLUDED.message_count,
            last_message_at = EXCLUDED.last_message_at,
            generated_at = EXCLUDED.generated_at,
            model = EXCLUDED.model
        `;

        console.log(`   ✅ Summary generated and saved (${summary.length} chars)`);
        generated++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`   ❌ Error processing PR #${pr.pr_number}:`, error);
        failed++;
      }
    }

    console.log(`\n✅ Summary generation completed!`);
    console.log(`   Generated: ${generated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}\n`);

  } catch (error) {
    console.error('\n❌ Summary generation failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generatePRSummaries()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { generatePRSummaries };
