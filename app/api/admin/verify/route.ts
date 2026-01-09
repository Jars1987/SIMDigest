import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
