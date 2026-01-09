#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';
import { graphqlWithAuth, REPO_OWNER, REPO_NAME } from './lib/graphql';
import { checkRateLimit } from './lib/github';

// GraphQL query to fetch discussions
const GET_DISCUSSIONS = `
  query($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      discussions(
        first: 50
        after: $cursor
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          title
          url
          author { login }
          createdAt
          updatedAt
          comments { totalCount }
          category { slug }
          body
        }
      }
    }
  }
`;

// GraphQL query to fetch discussion comments
const GET_DISCUSSION_COMMENTS = `
  query($owner: String!, $repo: String!, $discussionNumber: Int!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      discussion(number: $discussionNumber) {
        comments(first: 10, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            author { login }
            createdAt
            body
            url
          }
        }
      }
    }
  }
`;

function extractSIMDFromDiscussion(title: string, body: string): string | null {
  // Expanded regex to catch common patterns:
  // SIMD-0001, SIMD 0001, SIMD-0001:, simd0001
  const SIMD_REGEX = /SIMD[-\s:]?(\d{4})/i;

  // Check title first (higher priority)
  const titleMatch = title.match(SIMD_REGEX);
  if (titleMatch) return titleMatch[1];

  // Fallback to body (first occurrence only)
  const bodyMatch = body.match(SIMD_REGEX);
  if (bodyMatch) return bodyMatch[1];

  return null; // Unmapped discussion
}

async function fetchDiscussionComments(discussionNumber: number, limit = 10): Promise<any[]> {
  const comments = [];
  let cursor: string | null = null;
  let hasMore = true;
  let fetched = 0;

  try {
    while (hasMore && fetched < limit) {
      const result: any = await graphqlWithAuth(GET_DISCUSSION_COMMENTS, {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        discussionNumber,
        cursor,
      });

      const discussion = result.repository.discussion;
      if (!discussion || !discussion.comments) break;

      const nodes = discussion.comments.nodes || [];
      comments.push(...nodes);
      fetched += nodes.length;

      hasMore = discussion.comments.pageInfo.hasNextPage;
      cursor = discussion.comments.pageInfo.endCursor;

      if (fetched >= limit) {
        hasMore = false;
      }
    }

    return comments.slice(0, limit);
  } catch (error) {
    console.error(`   ⚠️  Error fetching comments for discussion #${discussionNumber}:`, error);
    return [];
  }
}

async function syncDiscussions() {
  console.log('\n🚀 Starting Discussions sync (Phase 2)...\n');

  await testConnection();
  await checkRateLimit();

  const jobId = crypto.randomUUID();

  try {
    // Record job start
    await sql`
      INSERT INTO sync_jobs (id, job_type, status, started_at)
      VALUES (${jobId}, 'discussions', 'running', NOW())
    `;

    let cursor: string | null = null;
    let hasMore = true;
    let processed = 0;
    let discussionsSynced = 0;
    let commentsSynced = 0;

    // Target categories (configurable)
    const targetCategories = ['simd-discussions', 'ideas']; // per SIMD-1

    while (hasMore) {
      console.log(`   Fetching discussions (cursor: ${cursor ? 'next page' : 'first page'})...`);

      const result: any = await graphqlWithAuth(GET_DISCUSSIONS, {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        cursor,
      });

      const discussions = result.repository.discussions;
      if (!discussions || !discussions.nodes || discussions.nodes.length === 0) {
        hasMore = false;
        break;
      }

      for (const discussion of discussions.nodes) {
        try {
          // Filter by target categories
          if (!targetCategories.includes(discussion.category.slug)) {
            processed++;
            continue;
          }

          // Extract SIMD ID from title/body (nullable)
          const simdId = extractSIMDFromDiscussion(discussion.title, discussion.body || '');

          // Verify SIMD exists if mapped
          if (simdId) {
            const simdExists = await sql`
              SELECT id FROM simds WHERE id = ${simdId}
            `;

            if (simdExists.length === 0) {
              // Optionally create placeholder SIMD for discussion-only SIMDs
              // For now, we'll allow unmapped discussions (simd_id = NULL)
              console.log(`   ⚠️  Discussion #${discussion.number} references SIMD-${simdId} which doesn't exist yet`);
            }
          }

          // Upsert discussion
          await sql`
            INSERT INTO simd_discussions (
              simd_id, github_discussion_id, discussion_number,
              title, url, author, created_at, updated_at,
              comment_count, category_slug
            ) VALUES (
              ${simdId},
              ${discussion.id},
              ${discussion.number},
              ${discussion.title},
              ${discussion.url},
              ${discussion.author?.login || 'unknown'},
              ${discussion.createdAt},
              ${discussion.updatedAt},
              ${discussion.comments.totalCount},
              ${discussion.category.slug}
            )
            ON CONFLICT (github_discussion_id) DO UPDATE SET
              simd_id = EXCLUDED.simd_id,
              title = EXCLUDED.title,
              updated_at = EXCLUDED.updated_at,
              comment_count = EXCLUDED.comment_count,
              category_slug = EXCLUDED.category_slug
          `;

          console.log(`   ✅ Synced Discussion #${discussion.number}: ${discussion.title.substring(0, 60)}...`);
          discussionsSynced++;

          // Fetch and store latest comments
          const comments = await fetchDiscussionComments(discussion.number, 10);

          // Get discussion UUID from database
          const discussionRow = await sql`
            SELECT id FROM simd_discussions WHERE github_discussion_id = ${discussion.id}
          `;

          if (discussionRow.length > 0) {
            const discussionDbId = discussionRow[0].id;

            for (const comment of comments) {
              try {
                await sql`
                  INSERT INTO simd_discussion_comments (
                    discussion_id, github_comment_id, author, created_at, body, url
                  ) VALUES (
                    ${discussionDbId},
                    ${comment.id},
                    ${comment.author?.login || 'unknown'},
                    ${comment.createdAt},
                    ${comment.body || ''},
                    ${comment.url || null}
                  )
                  ON CONFLICT (github_comment_id) DO UPDATE SET
                    body = EXCLUDED.body
                `;
                commentsSynced++;
              } catch (error) {
                // Ignore duplicate comment errors
              }
            }
          }

          processed++;
        } catch (error) {
          console.error(`   ❌ Error processing discussion #${discussion.number}:`, error);
        }
      }

      hasMore = discussions.pageInfo.hasNextPage;
      cursor = discussions.pageInfo.endCursor;

      // Rate limit check
      const { remaining } = await checkRateLimit();
      if (remaining < 50) {
        console.warn('\n⚠️  Approaching rate limit. Stopping early.\n');
        hasMore = false;
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

    console.log(`\n✅ Discussions sync completed!`);
    console.log(`   Processed: ${processed} discussions`);
    console.log(`   Synced: ${discussionsSynced} discussions`);
    console.log(`   Comments: ${commentsSynced}\n`);

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
  syncDiscussions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { syncDiscussions };
