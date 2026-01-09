#!/usr/bin/env tsx

import { generateDiscussionSummary } from '../lib/openai';

const testMessages = [
  {
    author: 'alice',
    body: 'I think we should implement feature X because it will improve performance',
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    author: 'bob',
    body: 'I agree, but we need to consider the backward compatibility issues',
    created_at: '2025-01-01T11:00:00Z',
  },
  {
    author: 'charlie',
    body: 'Good point. Let me update the proposal to address that concern.',
    created_at: '2025-01-01T12:00:00Z',
  },
];

async function test() {
  console.log('Testing OpenAI summary generation...\n');
  const summary = await generateDiscussionSummary(testMessages);
  console.log('Summary:', summary);
  console.log('Length:', summary.length);
}

test()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
