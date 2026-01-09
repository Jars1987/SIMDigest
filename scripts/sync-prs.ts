#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';
import { octokit, REPO, checkRateLimit } from './lib/github';
import { graphqlWithAuth, REPO_OWNER, REPO_NAME } from './lib/graphql';
import matter from 'gray-matter';

interface PRMapping {
  simdId: string;
  proposalFilePath: string | null;
}

// GraphQL query to fetch PR last commit and reviews
const GET_PR_DETAILS = `
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        commits(last: 1) {
          nodes {
            commit {
              committedDate
              oid
            }
          }
        }
        reviews(last: 100) {
          totalCount
          nodes {
            author { login }
          }
        }
      }
    }
  }
`;

async function getPRDetails(prNumber: number): Promise<{
  lastCommitAt: string | null;
  lastCommitSha: string | null;
  reviewCount: number;
  reviewerLogins: string[];
}> {
  try {
    const result: any = await graphqlWithAuth(GET_PR_DETAILS, {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      pr: prNumber,
    });

    const pr = result.repository.pullRequest;
    const lastCommit = pr.commits.nodes[0]?.commit;
    const reviews = pr.reviews.nodes || [];

    // Get unique reviewer logins
    const reviewerLogins = [...new Set(
      reviews
        .map((r: any) => r.author?.login)
        .filter((login: string | undefined) => login)
    )] as string[];

    return {
      lastCommitAt: lastCommit?.committedDate || null,
      lastCommitSha: lastCommit?.oid || null,
      reviewCount: pr.reviews.totalCount || 0,
      reviewerLogins,
    };
  } catch (error) {
    console.error(`   ⚠️  GraphQL error for PR #${prNumber}:`, error);
    return {
      lastCommitAt: null,
      lastCommitSha: null,
      reviewCount: 0,
      reviewerLogins: [],
    };
  }
}

async function mapPRToSIMD(pr: any): Promise<PRMapping | null> {
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
        // Check for XXXX- prefix (pre-numbering per SIMD-1)
        if (file.filename.includes('/XXXX-')) {
          // For XXXX- files, use PR number as SIMD ID (left-padded to 4 digits)
          const simdId = String(pr.number).padStart(4, '0');
          return { simdId, proposalFilePath: file.filename };
        }

        // Check for numbered proposal (NNNN-)
        const match = file.filename.match(/(\d{4})/);
        if (match) {
          return { simdId: match[1], proposalFilePath: file.filename };
        }
      }
    }

    // Fallback: check PR title for SIMD-XXXX pattern
    const titleMatch = pr.title.match(/SIMD[- ](\d{4})/i);
    if (titleMatch) {
      return { simdId: titleMatch[1], proposalFilePath: null };
    }

    // Fallback 2: check PR title for SIMD-<PR_NUMBER> pattern
    const prNumberMatch = pr.title.match(/SIMD[- ](\d+)/i);
    if (prNumberMatch && parseInt(prNumberMatch[1]) === pr.number) {
      const simdId = String(pr.number).padStart(4, '0');
      return { simdId, proposalFilePath: null };
    }

    return null;
  } catch (error) {
    console.error(`Error mapping PR #${pr.number}:`, error);
    return null;
  }
}

async function fetchProposalContent(pr: any, proposalFilePath: string): Promise<{
  content: string;
  status: string;
  title: string;
  summary: string;
} | null> {
  try {
    const { data } = await octokit.repos.getContent({
      ...REPO,
      path: proposalFilePath,
      ref: pr.head.sha,
    });

    if ('content' in data) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      // Parse frontmatter
      const { data: frontmatter, content: markdownContent } = matter(content);

      // Extract title from frontmatter or first H1
      let title = frontmatter.title || pr.title;
      if (!title) {
        const h1Match = markdownContent.match(/^#\s+(.+)$/m);
        if (h1Match) {
          title = h1Match[1];
        }
      }

      // Extract status from frontmatter, default to 'Draft' for PRs
      const status = frontmatter.status || 'Draft';

      // Extract summary from frontmatter, ## Summary section, or first paragraph
      let summary = frontmatter.summary || frontmatter.description || '';

      if (!summary) {
        // Try to find ## Summary section in markdown
        const summaryMatch = markdownContent.match(/##\s+Summary\s*\n\n([\s\S]*?)(?=\n##|$)/i);
        if (summaryMatch) {
          summary = summaryMatch[1].trim();
        }
      }

      if (!summary) {
        // Fallback: get first substantial paragraph
        const paragraphs = markdownContent.split('\n\n').filter(p =>
          p.trim() && !p.trim().startsWith('#') && p.trim().length > 50
        );
        summary = paragraphs[0]?.substring(0, 500) || '';
      }

      // Truncate summary to 500 chars max
      if (summary.length > 500) {
        summary = summary.substring(0, 500);
      }

      return { content, status, title, summary: summary.trim() };
    }

    return null;
  } catch (error) {
    console.error(`   ⚠️  Error fetching proposal content for PR #${pr.number}:`, error);
    return null;
  }
}

async function createPlaceholderSIMD(
  simdId: string,
  pr: any,
  proposalFilePath: string | null
): Promise<void> {
  try {
    let proposalContent = null;
    let status = 'Draft';
    let title = pr.title;
    let summary = '';

    // Try to fetch proposal content from PR if we have a file path
    if (proposalFilePath) {
      const proposal = await fetchProposalContent(pr, proposalFilePath);
      if (proposal) {
        proposalContent = proposal.content;
        status = proposal.status;
        title = proposal.title;
        summary = proposal.summary;
      }
    }

    // Extract title from PR title if it follows SIMD-XXXX: Title pattern
    const titleMatch = pr.title.match(/SIMD[- ]\d+:\s*(.+)/i);
    if (titleMatch && !title) {
      title = titleMatch[1];
    }

    const slug = `simd-${simdId}`;

    await sql`
      INSERT INTO simds (
        id, slug, title, proposal_path, proposal_content,
        proposal_updated_at, last_pr_activity_at, last_activity_at,
        status, summary, source_stage, pr_proposal_path
      ) VALUES (
        ${simdId},
        ${slug},
        ${title},
        NULL,
        ${proposalContent},
        ${pr.updated_at},
        ${pr.updated_at},
        ${pr.updated_at},
        ${status},
        ${summary || null},
        'pr',
        ${proposalFilePath}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        proposal_content = COALESCE(EXCLUDED.proposal_content, simds.proposal_content),
        proposal_updated_at = EXCLUDED.proposal_updated_at,
        last_pr_activity_at = EXCLUDED.last_pr_activity_at,
        last_activity_at = GREATEST(simds.last_activity_at, EXCLUDED.last_activity_at),
        status = EXCLUDED.status,
        summary = COALESCE(EXCLUDED.summary, simds.summary),
        pr_proposal_path = EXCLUDED.pr_proposal_path
    `;

    console.log(`   ➕ Created/updated PR-only SIMD-${simdId}: ${title.substring(0, 60)}...`);
  } catch (error) {
    console.error(`   ❌ Error creating placeholder SIMD-${simdId}:`, error);
    throw error;
  }
}

async function fetchLatestMessages(pr: any, simdId: string, limit = 100) {
  const messages = [];

  try {
    // Fetch ALL issue comments (paginated if needed)
    let page = 1;
    let hasMore = true;
    const perPage = 100;

    while (hasMore && messages.length < limit) {
      const { data: comments } = await octokit.issues.listComments({
        ...REPO,
        issue_number: pr.number,
        per_page: perPage,
        page,
        sort: 'created',
        direction: 'asc', // Changed to ascending to get chronological order
      });

      if (comments.length === 0) {
        hasMore = false;
        break;
      }

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

      if (comments.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Fetch ALL review comments (paginated if needed)
    page = 1;
    hasMore = true;

    while (hasMore && messages.length < limit) {
      const { data: reviewComments } = await octokit.pulls.listReviewComments({
        ...REPO,
        pull_number: pr.number,
        per_page: perPage,
        page,
        sort: 'created',
        direction: 'asc',
      });

      if (reviewComments.length === 0) {
        hasMore = false;
        break;
      }

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

      if (reviewComments.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Sort all messages by created_at chronologically
    messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return messages;
  } catch (error) {
    console.error(`Error fetching messages for PR #${pr.number}:`, error);
    return [];
  }
}

async function syncPRs(sinceDate?: Date, syncAllOpen = false) {
  console.log('\n🚀 Starting PR sync (Phase 2)...\n');

  await testConnection();
  await checkRateLimit();

  const jobId = crypto.randomUUID();

  try {
    // Record job start
    await sql`
      INSERT INTO sync_jobs (id, job_type, status, started_at)
      VALUES (${jobId}, 'prs', 'running', NOW())
    `;

    // Determine since date (default: 365 days ago, unless syncAllOpen is true)
    const since = syncAllOpen
      ? new Date(Date.now() - 365 * 5 * 24 * 60 * 60 * 1000) // 5 years ago (effectively all PRs)
      : (sinceDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)); // Changed from 90 to 365 days
    console.log(`📅 Fetching PRs updated since: ${since.toISOString()}${syncAllOpen ? ' (ALL PRs mode)' : ''}\n`);

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
          const mapping = await mapPRToSIMD(pr);

          if (!mapping) {
            // console.log(`   ⏭️  PR #${pr.number} doesn't relate to a SIMD`);
            processed++;
            continue;
          }

          const { simdId, proposalFilePath } = mapping;

          // Check if SIMD exists in database
          const simdExists = await sql`
            SELECT id FROM simds WHERE id = ${simdId}
          `;

          // Phase 2: Create placeholder SIMD if it doesn't exist (PR-only SIMD)
          if (simdExists.length === 0) {
            await createPlaceholderSIMD(simdId, pr, proposalFilePath);
          }

          // Fetch additional PR details via GraphQL
          const prDetails = await getPRDetails(pr.number);

          // Count comments and reviews
          const issueCommentCount = (pr as any).comments || 0;
          const reviewCommentCount = (pr as any).review_comments || 0;

          // Upsert PR with Phase 2 fields
          await sql`
            INSERT INTO simd_prs (
              simd_id, pr_number, pr_title, state, author,
              created_at, updated_at, merged_at, closed_at,
              issue_comment_count, review_comment_count, review_count,
              html_url, head_sha, base_ref, head_ref,
              last_commit_at, last_commit_sha,
              participant_count, reviewer_logins, proposal_file_path
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
              ${prDetails.reviewCount},
              ${pr.html_url},
              ${pr.head?.sha || null},
              ${pr.base?.ref || null},
              ${pr.head?.ref || null},
              ${prDetails.lastCommitAt},
              ${prDetails.lastCommitSha},
              0,
              ${JSON.stringify(prDetails.reviewerLogins)},
              ${proposalFilePath}
            )
            ON CONFLICT (simd_id, pr_number) DO UPDATE SET
              pr_title = EXCLUDED.pr_title,
              state = EXCLUDED.state,
              updated_at = EXCLUDED.updated_at,
              merged_at = EXCLUDED.merged_at,
              closed_at = EXCLUDED.closed_at,
              issue_comment_count = EXCLUDED.issue_comment_count,
              review_comment_count = EXCLUDED.review_comment_count,
              review_count = EXCLUDED.review_count,
              html_url = EXCLUDED.html_url,
              head_sha = EXCLUDED.head_sha,
              base_ref = EXCLUDED.base_ref,
              head_ref = EXCLUDED.head_ref,
              last_commit_at = EXCLUDED.last_commit_at,
              last_commit_sha = EXCLUDED.last_commit_sha,
              reviewer_logins = EXCLUDED.reviewer_logins,
              proposal_file_path = EXCLUDED.proposal_file_path
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

          // Update PR with message metadata for summary tracking
          const messageStats = await sql`
            SELECT
              COUNT(*) as total_count,
              MAX(created_at) as last_message_at
            FROM simd_messages
            WHERE simd_id = ${simdId} AND pr_number = ${pr.number}
          `;

          if (messageStats.length > 0) {
            await sql`
              UPDATE simd_prs
              SET
                total_message_count = ${messageStats[0].total_count},
                last_message_at = ${messageStats[0].last_message_at}
              WHERE simd_id = ${simdId} AND pr_number = ${pr.number}
            `;
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
  // Check if --all flag is passed
  const syncAll = process.argv.includes('--all');

  syncPRs(undefined, syncAll)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { syncPRs };
