import { NextResponse } from 'next/server';
import { syncDiscussions } from '@/scripts/sync-discussions';

export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await syncDiscussions();
    return NextResponse.json({ success: true, message: 'Discussions synced' });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
