import { NextResponse } from 'next/server';
import { sql } from '@/scripts/lib/db';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const newsletters = await sql`
      SELECT id, title, content, status, created_at, updated_at, sent_at, sent_count
      FROM newsletter_drafts
      ORDER BY created_at DESC
    `;

    return NextResponse.json(newsletters);
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, content, status = 'draft' } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO newsletter_drafts (title, content, status)
      VALUES (${title}, ${content}, ${status})
      RETURNING id, title, content, status, created_at
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to create newsletter' },
      { status: 500 }
    );
  }
}
