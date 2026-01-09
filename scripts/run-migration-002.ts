#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('🔄 Running Migration 002: PR Summaries...\n');

  await testConnection();

  try {
    // Step 1: Create simd_pr_summaries table
    console.log('  Creating simd_pr_summaries table...');
    await sql`
      CREATE TABLE IF NOT EXISTS simd_pr_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        simd_id VARCHAR(4) NOT NULL REFERENCES simds(id) ON DELETE CASCADE,
        pr_number INTEGER NOT NULL,
        summary TEXT NOT NULL,
        message_count INTEGER NOT NULL,
        last_message_at TIMESTAMPTZ,
        generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        model VARCHAR(50) DEFAULT 'gpt-5-mini',
        UNIQUE(simd_id, pr_number)
      )
    `;

    // Step 2: Create indexes
    console.log('  Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_simd_pr_summaries_simd_pr ON simd_pr_summaries(simd_id, pr_number)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_simd_pr_summaries_generated_at ON simd_pr_summaries(generated_at)`;

    // Step 3: Add columns to simd_prs
    console.log('  Adding columns to simd_prs...');
    await sql`ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ`;
    await sql`ALTER TABLE simd_prs ADD COLUMN IF NOT EXISTS total_message_count INTEGER DEFAULT 0`;

    // Step 4: Update existing data
    console.log('  Updating existing PR data with message metadata...');
    await sql`
      UPDATE simd_prs pr
      SET
        total_message_count = COALESCE(
          (SELECT COUNT(*) FROM simd_messages WHERE simd_id = pr.simd_id AND pr_number = pr.pr_number),
          0
        ),
        last_message_at = COALESCE(
          (SELECT MAX(created_at) FROM simd_messages WHERE simd_id = pr.simd_id AND pr_number = pr.pr_number),
          pr.updated_at
        )
    `;

    // Step 5: Create view
    console.log('  Creating prs_needing_summaries view...');
    await sql`
      CREATE OR REPLACE VIEW prs_needing_summaries AS
      SELECT
        pr.simd_id,
        pr.pr_number,
        pr.pr_title,
        pr.state,
        pr.total_message_count,
        pr.last_message_at,
        s.last_message_at as summary_last_message_at,
        s.generated_at as summary_generated_at,
        CASE
          WHEN s.id IS NULL THEN 'no_summary'
          WHEN pr.last_message_at > s.last_message_at THEN 'new_messages'
          WHEN pr.total_message_count != s.message_count THEN 'message_count_changed'
          ELSE 'up_to_date'
        END as summary_status
      FROM simd_prs pr
      LEFT JOIN simd_pr_summaries s ON pr.simd_id = s.simd_id AND pr.pr_number = s.pr_number
      WHERE pr.state = 'open'
        AND pr.total_message_count > 0
    `;

    console.log('\n✅ Migration 002 completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
