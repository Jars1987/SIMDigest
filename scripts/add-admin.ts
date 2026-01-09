#!/usr/bin/env tsx

import { sql, testConnection } from './lib/db';
import bcrypt from 'bcrypt';
import * as readline from 'readline';

const SALT_ROUNDS = 12;

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function questionHidden(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(query);

    // Hide input
    if (stdin.isTTY) {
      (stdin as any).setRawMode(true);
    }

    let password = '';

    const onData = (char: Buffer) => {
      const key = char.toString('utf8');

      switch (key) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.removeListener('data', onData);
          if (stdin.isTTY) {
            (stdin as any).setRawMode(false);
          }
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit(0);
          break;
        case '\u007f': // Backspace
        case '\u0008':
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          password += key;
          stdout.write('*');
      }
    };

    stdin.on('data', onData);
  });
}

async function addAdmin() {
  console.log('\n👤 Add New Admin\n');

  await testConnection();

  const rl = createReadlineInterface();

  try {
    // Get email from command line or prompt
    let email = process.argv[2];

    if (!email) {
      email = await question(rl, 'Admin email: ');
    }

    email = email.toLowerCase().trim();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    // Check if admin already exists
    const existing = await sql`
      SELECT id FROM admins WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.error(`❌ Admin with email ${email} already exists`);
      process.exit(1);
    }

    // Get name
    let name: string | null = await question(rl, 'Admin name (optional): ');
    name = name.trim() || null;

    // Get password
    const password = await questionHidden(rl, 'Password: ');

    if (password.length < 8) {
      console.error('\n❌ Password must be at least 8 characters');
      process.exit(1);
    }

    const passwordConfirm = await questionHidden(rl, 'Confirm password: ');

    if (password !== passwordConfirm) {
      console.error('\n❌ Passwords do not match');
      process.exit(1);
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert admin
    await sql`
      INSERT INTO admins (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
    `;

    console.log(`\n✅ Admin added successfully!`);
    console.log(`   Email: ${email}`);
    if (name) {
      console.log(`   Name: ${name}`);
    }
    console.log(`\nYou can now login at: http://localhost:3001/admin/newsletter\n`);

  } catch (error) {
    console.error('\n❌ Error adding admin:', error);
    throw error;
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  addAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { addAdmin };
