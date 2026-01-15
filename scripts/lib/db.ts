import postgres from 'postgres';
import dotenv from 'dotenv';

// Only load dotenv in non-production (Vercel injects env vars automatically)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const databaseUrl = process.env.DATABASE_URL_TRANSACTION_POOLER || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found. Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('SUPABASE')));
  throw new Error('DATABASE_URL or DATABASE_URL_TRANSACTION_POOLER environment variable is required');
}

export const sql = postgres(databaseUrl, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
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
