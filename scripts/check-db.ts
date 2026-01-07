#!/usr/bin/env tsx

import { sql } from './lib/db';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database status...\n');

    // Test connection
    const now = await sql`SELECT NOW()`;
    console.log('✅ Database connection successful\n');

    // Check if tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      console.log('❌ No tables found in database');
      console.log('\n📋 Next step: Run the schema.sql file in Supabase SQL Editor');
      console.log('   File location: database/schema.sql\n');
      process.exit(0);
    }

    console.log('📊 Tables found:');
    tables.forEach((t) => console.log(`   ✓ ${t.table_name}`));

    // Check counts
    const counts = await Promise.all([
      sql`SELECT COUNT(*) as count FROM simds`,
      sql`SELECT COUNT(*) as count FROM simd_prs`,
      sql`SELECT COUNT(*) as count FROM simd_messages`,
      sql`SELECT COUNT(*) as count FROM subscribers`,
    ]);

    console.log('\n📈 Record counts:');
    console.log(`   simds: ${counts[0][0].count}`);
    console.log(`   simd_prs: ${counts[1][0].count}`);
    console.log(`   simd_messages: ${counts[2][0].count}`);
    console.log(`   subscribers: ${counts[3][0].count}`);

    if (counts[0][0].count === '0') {
      console.log('\n💡 Database is empty. Run sync to populate:');
      console.log('   npm run sync\n');
    } else {
      console.log('\n✅ Database has data!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabase();
