#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  console.log('\n🚀 Setting up database schema...\n');

  try {
    await testConnection();

    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📝 Executing schema SQL...\n');

    // Execute the entire schema
    // Note: We use sql.unsafe() for raw SQL execution
    await sql.unsafe(schema);

    console.log('✅ Database schema created successfully!\n');

    // Verify tables were created
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📊 Tables created:');
    tables.forEach((t) => console.log(`   ✓ ${t.table_name}`));

    console.log('\n✅ Database setup complete!\n');
    console.log('💡 Next step: Run initial sync to populate data');
    console.log('   npm run sync\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.error('\n💡 Alternative: Copy database/schema.sql into Supabase SQL Editor\n');
    process.exit(1);
  }
}

setupDatabase();
