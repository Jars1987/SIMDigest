import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sendVerificationEmail } from '@/lib/email';

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  const [, domain] = email.split('@');
  if (!domain || domain.length < 3 || !domain.includes('.')) return false;
  return true;
}

function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const verificationToken = generateVerificationToken();

    const { error } = await supabase
      .from('subscribers')
      .insert([{
        email: normalizedEmail,
        verified: false,
        verification_token: verificationToken
      }]);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, message: 'This email is already subscribed' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Send verification email
    const emailSent = await sendVerificationEmail(normalizedEmail, verificationToken);

    if (!emailSent) {
      console.error('Failed to send verification email to:', normalizedEmail);
      return NextResponse.json({
        success: true,
        message: 'Subscribed! Verification email could not be sent - please contact support.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed! Check your email to confirm.',
    });

  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}
