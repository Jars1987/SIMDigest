import { NextResponse } from 'next/server';
import { sql } from '@/scripts/lib/db';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find subscriber with this token
    const subscribers = await sql`
      SELECT email, verified
      FROM subscribers
      WHERE verification_token = ${token}
    `;

    if (subscribers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification link' },
        { status: 400 }
      );
    }

    const subscriber = subscribers[0];

    if (subscriber.verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        email: subscriber.email
      });
    }

    // Update subscriber to verified
    await sql`
      UPDATE subscribers
      SET verified = true, verification_token = NULL, updated_at = NOW()
      WHERE verification_token = ${token}
    `;

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      email: subscriber.email
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
