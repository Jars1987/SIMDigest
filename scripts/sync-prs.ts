#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';
import { octokit, REPO, checkRateLimit } from './lib/github';

async function mapPRToSIMD(pr: any): Promise<string | null> {
  try {
    // Get files changed in the PR
    const { data: files } = await octokit.pulls.listFiles({
      ...REPO,
      pull_number: pr.number,
      per_page: 100,
    });

    // Look for proposals/*.md files
    for (const file of files) {
      if (file.filename.startsWith('proposals/') && file.filename.endsWith('.md')) {
        const match = file.filename.match(/(\d{4})/);
        if (match) {
          return match[1]; // Return SIMD ID
        }
      }
    }

    // Fallback: check PR title for SIMD-XXXX pattern
    const titleMatch = pr.title.match(/SIMD[- ](\d{4})/i);
    if (titleMatch) {
      return titleMatch[1];
    }

    return null;
  } catch (error) {
    console.error(`Error mapping PR #${pr.number}:`, error);
    return null;
  }
}

async function fetchLatestMessages(pr: any, simdId: string, limit = 5) {
  const messages = [];

  try {
    // Fetch issue comments
    const { data: comments } = await octokit.issues.listComments({
      ...REPO,
      issue_number: pr.number,
      per_page: limit,
      sort: 'created',
      direction: 'desc',
    });

    for (const comment of comments) {
      messages.push({
        simd_id: simdId,
        pr_number: pr.number,
        github_id: comment.id,
        type: 'comment',
        author: comment.user?.login || 'unknown',
        created_at: comment.created_at,
        body: comment.body || '',
        url: comment.html_url,
      });
    }

    // Fetch review comments (limit to avoid rate limit)
    const { data: reviewComments } = await octokit.pulls.listReviewComments({
      ...REPO,
      pull_number: pr.number,
      per_page: Math.max(1, limit - comments.length),
      sort: 'created',
      direction: 'desc',
    });

    for (const comment of reviewComments) {
      messages.push({
        simd_id: simdId,
        pr_number: pr.number,
        github_id: comment.id,
        type: 'review',
        author: comment.user?.login || 'unknown',
        created_at: comment.created_at,
        body: comment.body || '',
        url: comment.html_url,
      });
    }

    return messages.slice(0, limit);
  } catch (error) {
    console.error(`Error fetching messages for PR #${pr.number}:`, error);
    return [];
  }
}

async function syncPRs(sinceDate?: Date) {
  console.log('\n🚀 Starting PR sync...\n');

  await testConnection();
  await checkRateLimit();

  const jobId = crypto.randomUUID();

  try {
    // Record job start
    await sql`
      INSERT INTO sync_jobs (id, job_type, status, started_at)
      VALUES (${jobId}, 'prs', 'running', NOW())
    `;

    // Determine since date (default: 90 days ago)
    const since = sinceDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    console.log(`📅 Fetching PRs updated since: ${since.toISOString()}\n`);

    let page = 1;
    let hasMore = true;
    let processed = 0;
    let prsSynced = 0;
    let messagesSynced = 0;

    while (hasMore) {
      console.log(`   Fetching page ${page}...`);

      const { data: prs } = await octokit.pulls.list({
        ...REPO,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 30,
        page,
      });

      if (prs.length === 0) {
        hasMore = false;
        break;
      }

      for (const pr of prs) {
        const prUpdatedAt = new Date(pr.updated_at);

        // Stop if we've reached PRs older than our since date
        if (prUpdatedAt < since) {
          hasMore = false;
          break;
        }

        try {
          // Map PR to SIMD
          const simdId = await mapPRToSIMD(pr);

          if (!simdId) {
            // console.log(`   ⏭️  PR #${pr.number} doesn't relate to a SIMD`);
            processed++;
            continue;
          }

          // Verify SIMD exists in database
          const simdExists = await sql`
            SELECT id FROM simds WHERE id = ${simdId}
          `;

          if (simdExists.length === 0) {
            console.log(`   ⚠️  PR #${pr.number} references SIMD-${simdId} which doesn't exist yet`);
            processed++;
            continue;
          }

          // Count comments and reviews
          const issueCommentCount = pr.comments || 0;
          const reviewCommentCount = pr.review_comments || 0;

          // Upsert PR
          await sql`
            INSERT INTO simd_prs (
              simd_id, pr_number, pr_title, state, author,
              created_at, updated_at, merged_at, closed_at,
              issue_comment_count, review_comment_count, review_count
            ) VALUES (
              ${simdId},
              ${pr.number},
              ${pr.title},
              ${pr.state},
              ${pr.user?.login || 'unknown'},
              ${pr.created_at},
              ${pr.updated_at},
              ${pr.merged_at},
              ${pr.closed_at},
              ${issueCommentCount},
              ${reviewCommentCount},
              0
            )
            ON CONFLICT (simd_id, pr_number) DO UPDATE SET
              pr_title = EXCLUDED.pr_title,
              state = EXCLUDED.state,
              updated_at = EXCLUDED.updated_at,
              merged_at = EXCLUDED.merged_at,
              closed_at = EXCLUDED.closed_at,
              issue_comment_count = EXCLUDED.issue_comment_count,
              review_comment_count = EXCLUDED.review_comment_count
          `;

          // Update SIMD's last_pr_activity_at
          await sql`
            UPDATE simds
            SET last_pr_activity_at = ${pr.updated_at},
                last_activity_at = GREATEST(last_activity_at, ${pr.updated_at}::timestamptz)
            WHERE id = ${simdId}
          `;

          console.log(`   ✅ Synced PR #${pr.number} -> SIMD-${simdId}: ${pr.title.substring(0, 60)}...`);
          prsSynced++;

          // Fetch and store latest messages
          const messages = await fetchLatestMessages(pr, simdId);

          for (const msg of messages) {
            try {
              await sql`
                INSERT INTO simd_messages (
                  simd_id, pr_number, github_id, type, author, created_at, body, url
                ) VALUES (
                  ${msg.simd_id},
                  ${msg.pr_number},
                  ${msg.github_id},
                  ${msg.type},
                  ${msg.author},
                  ${msg.created_at},
                  ${msg.body},
                  ${msg.url}
                )
                ON CONFLICT (github_id) DO UPDATE SET
                  body = EXCLUDED.body
              `;
              messagesSynced++;
            } catch (error) {
              // Ignore duplicate message errors
            }
          }

          processed++;
        } catch (error) {
          console.error(`   ❌ Error processing PR #${pr.number}:`, error);
        }
      }

      page++;

      // Rate limit check every 30 PRs
      if (processed % 30 === 0) {
        const { remaining } = await checkRateLimit();
        if (remaining < 50) {
          console.warn('\n⚠️  Approaching rate limit. Stopping early.\n');
          hasMore = false;
        }
      }
    }

    // Record job completion
    await sql`
      UPDATE sync_jobs
      SET status = 'completed',
          completed_at = NOW(),
          records_processed = ${processed}
      WHERE id = ${jobId}
    `;

    console.log(`\n✅ PR sync completed!`);
    console.log(`   Processed: ${processed} PRs`);
    console.log(`   Synced: ${prsSynced} PRs`);
    console.log(`   Messages: ${messagesSynced}\n`);

  } catch (error) {
    console.error('\n❌ Sync failed:', error);

    await sql`
      UPDATE sync_jobs
      SET status = 'failed',
          completed_at = NOW(),
          error_message = ${error instanceof Error ? error.message : 'Unknown error'}
      WHERE id = ${jobId}
    `;

    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  syncPRs()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { syncPRs };
