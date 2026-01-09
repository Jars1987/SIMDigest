#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';
import { generateDiscussionSummary } from '../lib/openai';

async function testOnePR() {
  console.log('Testing PR summary generation from database...\n');

  await testConnection();

  // Get one PR
  const pr = await sql`
    SELECT simd_id, pr_number
    FROM simd_prs
    WHERE state = 'open'
    LIMIT 1
  `;

  if (pr.length === 0) {
    console.log('No open PRs found');
    return;
  }

  console.log(`Testing SIMD-${pr[0].simd_id} PR #${pr[0].pr_number}`);

  // Get messages
  const messages = await sql`
    SELECT author, body, created_at
    FROM simd_messages
    WHERE simd_id = ${pr[0].simd_id} AND pr_number = ${pr[0].pr_number}
    ORDER BY created_at ASC
  `;

  console.log(`Found ${messages.length} messages`);

  if (messages.length === 0) {
    console.log('No messages found');
    return;
  }

  // Print first message preview
  console.log('First message:', messages[0].body.substring(0, 100) + '...');

  // Generate summary
  console.log('\nGenerating summary...');
  const messageArray = messages.map(m => ({
    author: m.author,
    body: m.body,
    created_at: m.created_at
  }));
  const summary = await generateDiscussionSummary(messageArray);

  console.log(`\nSummary (${summary.length} chars):`);
  console.log(summary);
}

testOnePR()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
