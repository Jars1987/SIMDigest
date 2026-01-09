import { NextResponse } from 'next/server';
import { sql } from '@/scripts/lib/db';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscribers = await sql`
      SELECT email, verified, created_at
      FROM subscribers
      ORDER BY created_at DESC
    `;

    return NextResponse.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}
