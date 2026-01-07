#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';
import { octokit, REPO, checkRateLimit } from './lib/github';
import matter from 'gray-matter';

interface ProposalFile {
  name: string;
  path: string;
  sha: string;
  size: number;
}

async function extractSIMDId(filename: string): Promise<string | null> {
  // Match patterns like: 0370-title.md, simd-0370.md, SIMD-0370.md
  const match = filename.match(/(\d{4})/);
  return match ? match[1] : null;
}

async function parseProposalContent(content: string) {
  try {
    // Try to parse frontmatter if it exists
    const { data, content: mainContent } = matter(content);

    // Extract title from first H1 heading or frontmatter
    let title = data.title || '';
    if (!title) {
      const titleMatch = mainContent.match(/^#\s+(.+)$/m);
      title = titleMatch ? titleMatch[1].trim() : 'Untitled Proposal';
    }

    // Extract summary from frontmatter or first paragraph
    let summary = data.summary || data.description || '';
    if (!summary) {
      const paragraphs = mainContent.split('\n\n').filter(p =>
        p.trim() && !p.trim().startsWith('#') && p.trim().length > 50
      );
      summary = paragraphs[0]?.substring(0, 500) || '';
    }

    // Extract topics/tags
    const topics = data.topics || data.tags || [];

    return {
      title: title.replace(/^SIMD-\d+:\s*/i, '').trim(),
      summary: summary.trim(),
      topics: topics.length > 0 ? topics : null,
      content: mainContent,
    };
  } catch (error) {
    console.error('Error parsing content:', error);
    return {
      title: 'Untitled Proposal',
      summary: '',
      topics: null,
      content,
    };
  }
}

async function syncProposals() {
  console.log('\n🚀 Starting proposal sync...\n');

  await testConnection();
  await checkRateLimit();

  const jobId = crypto.randomUUID();

  try {
    // Record job start
    await sql`
      INSERT INTO sync_jobs (id, job_type, status, started_at)
      VALUES (${jobId}, 'proposals', 'running', NOW())
    `;

    // Get all files in proposals directory
    console.log('\n📁 Fetching proposal files from GitHub...');
    const { data: contents } = await octokit.repos.getContent({
      ...REPO,
      path: 'proposals',
    });

    if (!Array.isArray(contents)) {
      throw new Error('Expected array of files');
    }

    const proposals: ProposalFile[] = contents
      .filter((item) => item.type === 'file' && item.name.endsWith('.md'))
      .map((item) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size,
      }));

    console.log(`   Found ${proposals.length} proposal files\n`);

    let processed = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const proposal of proposals) {
      try {
        const simdId = await extractSIMDId(proposal.name);

        if (!simdId) {
          console.log(`   ⏭️  Skipping ${proposal.name} (no SIMD ID found)`);
          skipped++;
          continue;
        }

        // Check if we already have this version
        const existing = await sql`
          SELECT id, proposal_sha
          FROM simds
          WHERE id = ${simdId}
        `;

        if (existing.length > 0 && existing[0].proposal_sha === proposal.sha) {
          console.log(`   ✓ SIMD-${simdId} up to date`);
          processed++;
          continue;
        }

        // Fetch file content
        console.log(`   📥 Fetching SIMD-${simdId}...`);
        const { data: fileData } = await octokit.repos.getContent({
          ...REPO,
          path: proposal.path,
        });

        if ('content' in fileData && fileData.content) {
          const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
          const parsed = await parseProposalContent(content);

          // Get last commit date for this file
          const { data: commits } = await octokit.repos.listCommits({
            ...REPO,
            path: proposal.path,
            per_page: 1,
          });

          const lastCommitDate = commits[0]?.commit.author?.date || new Date().toISOString();

          // Upsert SIMD
          const slug = `simd-${simdId}`;

          await sql`
            INSERT INTO simds (
              id, slug, title, proposal_path, proposal_sha, proposal_content,
              proposal_updated_at, last_activity_at, status, summary, topics
            ) VALUES (
              ${simdId},
              ${slug},
              ${parsed.title},
              ${proposal.path},
              ${proposal.sha},
              ${parsed.content},
              ${lastCommitDate},
              ${lastCommitDate},
              'active',
              ${parsed.summary || null},
              ${parsed.topics ? JSON.stringify(parsed.topics) : null}
            )
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              proposal_sha = EXCLUDED.proposal_sha,
              proposal_content = EXCLUDED.proposal_content,
              proposal_updated_at = EXCLUDED.proposal_updated_at,
              last_activity_at = GREATEST(simds.last_activity_at, EXCLUDED.proposal_updated_at),
              summary = EXCLUDED.summary,
              topics = EXCLUDED.topics,
              updated_at = NOW()
          `;

          if (existing.length > 0) {
            console.log(`   ✅ Updated SIMD-${simdId}: ${parsed.title}`);
            updated++;
          } else {
            console.log(`   ✨ Created SIMD-${simdId}: ${parsed.title}`);
            created++;
          }

          processed++;
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${proposal.name}:`, error);
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

    console.log(`\n✅ Proposal sync completed!`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}\n`);

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
  syncProposals()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { syncProposals };
