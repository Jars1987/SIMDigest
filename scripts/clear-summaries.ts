#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';

async function clearSummaries() {
  await testConnection();
  await sql`DELETE FROM simd_pr_summaries`;
  console.log('✅ Cleared all PR summaries');
}

clearSummaries()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
