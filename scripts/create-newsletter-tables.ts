#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';

async function createNewsletterTables() {
  console.log('\n📧 Creating newsletter tables...\n');

  await testConnection();

  try {
    // Create newsletter_drafts table
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_drafts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        html_content TEXT,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        sent_at TIMESTAMPTZ,
        sent_count INTEGER DEFAULT 0
      )
    `;

    console.log('✅ newsletter_drafts table created');

    // Create newsletter_sends table (track who received which newsletter)
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_sends (
        id SERIAL PRIMARY KEY,
        newsletter_id INTEGER REFERENCES newsletter_drafts(id) ON DELETE CASCADE,
        subscriber_email TEXT NOT NULL,
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        opened_at TIMESTAMPTZ,
        UNIQUE(newsletter_id, subscriber_email)
      )
    `;

    console.log('✅ newsletter_sends table created');

    console.log('\n✅ Newsletter tables created successfully!\n');

  } catch (error) {
    console.error('\n❌ Error creating newsletter tables:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createNewsletterTables()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createNewsletterTables };
