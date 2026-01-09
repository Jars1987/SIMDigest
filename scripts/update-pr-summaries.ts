#!/usr/bin/env tsx

import { sql } from './lib/db';
import { octokit, REPO } from './lib/github';
import matter from 'gray-matter';

async function updatePRSummaries() {
  console.log('\n🔄 Updating summaries for open PRs...\n');

  // Get all open PRs
  const openPRs = await sql`
    SELECT DISTINCT p.pr_number, p.simd_id, p.proposal_file_path
    FROM simd_prs p
    WHERE p.state = 'open' AND p.proposal_file_path IS NOT NULL
    ORDER BY p.pr_number DESC
  `;

  console.log(`Found ${openPRs.length} open PRs with proposal files\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const pr of openPRs) {
    try {
      console.log(`   Processing SIMD-${pr.simd_id} (PR #${pr.pr_number})...`);

      // Get PR details
      const { data: prData } = await octokit.pulls.get({
        ...REPO,
        pull_number: pr.pr_number,
      });

      // Get proposal content
      const { data } = await octokit.repos.getContent({
        ...REPO,
        path: pr.proposal_file_path,
        ref: prData.head.sha,
      });

      if ('content' in data) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const { data: frontmatter, content: markdownContent } = matter(content);

        // Extract summary
        let summary = frontmatter.summary || frontmatter.description || '';

        if (!summary || summary.length === 0) {
          const summaryMatch = markdownContent.match(/##\s+Summary\s*\n\n([\s\S]*?)(?=\n##|$)/i);
          if (summaryMatch) {
            summary = summaryMatch[1].trim();
          }
        }

        if (!summary || summary.length === 0) {
          const paragraphs = markdownContent.split('\n\n').filter(p =>
            p.trim() && !p.trim().startsWith('#') && p.trim().length > 50
          );
          summary = paragraphs[0]?.substring(0, 500) || '';
        }

        if (summary.length > 500) {
          summary = summary.substring(0, 500);
        }

        if (summary && summary.length > 0) {
          await sql`
            UPDATE simds
            SET summary = ${summary}
            WHERE id = ${pr.simd_id}
          `;
          console.log(`      ✅ Updated summary (${summary.length} chars)`);
          updated++;
        } else {
          console.log(`      ⏭️  No summary found`);
          skipped++;
        }
      }
    } catch (error) {
      console.error(`      ❌ Error:`, error instanceof Error ? error.message : error);
      failed++;
    }
  }

  console.log(`\n✅ Summary update completed!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}\n`);

  process.exit(0);
}

updatePRSummaries();
