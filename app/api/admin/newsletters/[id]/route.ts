import { NextResponse } from 'next/server';
import { sql } from '@/scripts/lib/db';
import { verifyAdminAuth } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE newsletter_drafts
      SET title = ${title}, content = ${content}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, title, content, status, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to update newsletter' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await sql`
      DELETE FROM newsletter_drafts
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to delete newsletter' },
      { status: 500 }
    );
  }
}
