#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';

async function listAdmins() {
  console.log('\n👥 Admin Users\n');

  await testConnection();

  try {
    const admins = await sql`
      SELECT
        id,
        email,
        name,
        is_active,
        created_at,
        last_login_at
      FROM admins
      ORDER BY created_at DESC
    `;

    if (admins.length === 0) {
      console.log('No admin users found.\n');
      console.log('Add an admin with: npm run admin:add -- email@example.com\n');
      return;
    }

    console.log(`Total admins: ${admins.length}\n`);

    for (const admin of admins) {
      const status = admin.is_active ? '✅ Active' : '❌ Inactive';
      const lastLogin = admin.last_login_at
        ? new Date(admin.last_login_at).toLocaleDateString()
        : 'Never';

      console.log(`${status} | ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      if (admin.name) {
        console.log(`   Name: ${admin.name}`);
      }
      console.log(`   Created: ${new Date(admin.created_at).toLocaleDateString()}`);
      console.log(`   Last login: ${lastLogin}`);
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error listing admins:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  listAdmins()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { listAdmins };
