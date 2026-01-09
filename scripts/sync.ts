#!/usr/bin/env tsx

import { syncProposals } from './sync-proposals';
import { syncPRs } from './sync-prs';
import { syncDiscussions } from './sync-discussions';
import { testConnection } from './lib/db';

async function fullSync() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   SIMD Tracker - Full Database Sync (Phase 2)');
  console.log('═══════════════════════════════════════════════════\n');

  const startTime = Date.now();

  try {
    // Test database connection
    await testConnection();

    // Step 1: Sync proposals first (creates SIMD records from main branch)
    console.log('\n━━━ Step 1: Syncing Proposals ━━━');
    await syncProposals();

    // Step 2: Sync PRs and messages (creates PR-only SIMD records, enhances existing records)
    console.log('\n━━━ Step 2: Syncing Pull Requests ━━━');
    await syncPRs();

    // Step 3: Sync GitHub Discussions (Phase 2)
    console.log('\n━━━ Step 3: Syncing Discussions ━━━');
    await syncDiscussions();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('   ✅ Full Sync Completed Successfully!');
    console.log(`   ⏱️  Duration: ${duration}s`);
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════');
    console.error('   ❌ Sync Failed');
    console.error('═══════════════════════════════════════════════════\n');
    console.error(error);
    process.exit(1);
  }
}

// Run sync
fullSync()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
