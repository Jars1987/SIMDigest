import { NextResponse } from 'next/server';
import { sql } from '@/scripts/lib/db';
import { verifyAdminAuth } from '@/lib/auth';
import { sendNewsletterEmail } from '@/lib/email';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get newsletter
    const newsletter = await sql`
      SELECT id, title, content, status
      FROM newsletter_drafts
      WHERE id = ${id}
    `;

    if (newsletter.length === 0) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      );
    }

    if (newsletter[0].status === 'sent') {
      return NextResponse.json(
        { error: 'Newsletter already sent' },
        { status: 400 }
      );
    }

    // Get verified subscribers with their tokens
    const subscribers = await sql`
      SELECT email, verification_token
      FROM subscribers
      WHERE verified = true
    `;

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No verified subscribers' },
        { status: 400 }
      );
    }

    console.log(`\n📧 Sending newsletter "${newsletter[0].title}" to ${subscribers.length} subscribers...`);

    let successCount = 0;
    let failedCount = 0;

    // Send emails to all verified subscribers
    for (const subscriber of subscribers) {
      const sent = await sendNewsletterEmail({
        to: subscriber.email,
        subject: newsletter[0].title,
        content: newsletter[0].content,
        unsubscribeToken: subscriber.verification_token,
      });

      if (sent) {
        successCount++;
        // Record successful send
        await sql`
          INSERT INTO newsletter_sends (newsletter_id, subscriber_email)
          VALUES (${id}, ${subscriber.email})
          ON CONFLICT (newsletter_id, subscriber_email) DO NOTHING
        `;
      } else {
        failedCount++;
      }
    }

    console.log(`✅ Newsletter sent: ${successCount} successful, ${failedCount} failed\n`);

    // Mark newsletter as sent
    await sql`
      UPDATE newsletter_drafts
      SET status = 'sent', sent_at = NOW(), sent_count = ${successCount}
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      sent_count: successCount,
      failed_count: failedCount,
      message: `Newsletter sent successfully to ${successCount} subscribers${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
    });

  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}
