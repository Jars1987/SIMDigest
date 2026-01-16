import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { generateEmailHtml } from '@/lib/email';

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content, bannerUrl } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Generate the HTML preview with a sample unsubscribe URL
    const html = generateEmailHtml(content, {
      unsubscribeUrl: '#unsubscribe-preview',
      bannerUrl: bannerUrl || null,
    });

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
