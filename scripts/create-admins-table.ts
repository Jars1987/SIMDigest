#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';

async function createAdminsTable() {
  console.log('\n👤 Creating admins table...\n');

  await testConnection();

  try {
    // Create admins table
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true
      )
    `;

    console.log('✅ admins table created');

    // Create index on email for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)
    `;

    console.log('✅ Email index created');

    console.log('\n✅ Admin table setup completed!\n');
    console.log('Next steps:');
    console.log('1. Run: npm run admin:add -- joserelvassantos@gmail.com');
    console.log('2. Enter a secure password when prompted');
    console.log('3. Use email/password to login at /admin/newsletter\n');

  } catch (error) {
    console.error('\n❌ Error creating admins table:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createAdminsTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createAdminsTable };
