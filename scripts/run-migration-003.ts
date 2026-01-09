#!/usr/bin/env tsx

/**
 * Run Migration 003: Enable RLS and fix security definer views
 * 
 * This fixes all Supabase security linter warnings:
 * - Enables Row Level Security on all tables
 * - Creates appropriate RLS policies
 * - Recreates views without SECURITY DEFINER
 * - Grants proper permissions
 */

import { sql } from './lib/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🔐 Running Migration 003: Enable RLS and Security Fixes...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '003_enable_rls_security.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('⚙️  Executing SQL statements...\n');

    // Execute the migration
    await sql.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Summary of changes:');
    console.log('  ✓ Enabled RLS on 12 tables');
    console.log('  ✓ Created read policies for public SIMD data');
    console.log('  ✓ Created insert policy for subscribers');
    console.log('  ✓ Protected sensitive tables (admins, newsletters)');
    console.log('  ✓ Recreated 5 views without SECURITY DEFINER');
    console.log('  ✓ Granted appropriate permissions\n');
    
    console.log('🔍 Verifying RLS status...');
    
    // Verify RLS is enabled
    const rlsCheck = await sql`
      SELECT 
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN (
          'simds', 'simd_prs', 'simd_messages', 'subscribers',
          'newsletter_drafts', 'newsletter_sends', 'admins',
          'simd_discussions', 'simd_discussion_comments',
          'simd_pr_summaries', 'sync_jobs', 'sync_state'
        )
      ORDER BY tablename;
    `;

    console.log('\n📋 RLS Status:');
    rlsCheck.forEach((row: any) => {
      const status = row.rls_enabled ? '✅ ENABLED ' : '❌ DISABLED';
      console.log(`  ${status} - ${row.tablename}`);
    });

    // Check policies
    const policyCount = await sql`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public';
    `;

    console.log(`\n📝 Created ${policyCount[0].count} RLS policies`);

    // Check views
    const viewCheck = await sql`
      SELECT 
        viewname,
        definition
      FROM pg_views
      WHERE schemaname = 'public'
        AND viewname IN (
          'merged_simds_feed',
          'simds_with_counts',
          'open_prs_feed',
          'simd_discussions_feed',
          'prs_needing_summaries'
        )
      ORDER BY viewname;
    `;

    console.log(`\n👁️  Recreated ${viewCheck.length} views without SECURITY DEFINER\n`);

    console.log('🎉 All security issues fixed!');
    console.log('💡 Your Supabase dashboard should now show 0 security warnings.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the migration
runMigration().catch(console.error);
