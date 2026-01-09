import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL_TRANSACTION_POOLER || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL_SESSION_POOLER or DATABASE_URL environment variable is required');
}

export const sql = postgres(databaseUrl, {
  ssl: 'require',
  max: 10,
});

export async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}
