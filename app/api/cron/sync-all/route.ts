import { NextResponse } from 'next/server';
import { syncProposals } from '@/scripts/sync-proposals';
import { syncPRs } from '@/scripts/sync-prs';
import { syncDiscussions } from '@/scripts/sync-discussions';

export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    proposals: { success: false, error: null as string | null },
    prs: { success: false, error: null as string | null },
    discussions: { success: false, error: null as string | null },
  };

  try {
    // Sync proposals
    try {
      await syncProposals();
      results.proposals.success = true;
    } catch (error) {
      results.proposals.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Proposals sync failed:', error);
    }

    // Sync PRs
    try {
      await syncPRs();
      results.prs.success = true;
    } catch (error) {
      results.prs.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('PRs sync failed:', error);
    }

    // Sync discussions
    try {
      await syncDiscussions();
      results.discussions.success = true;
    } catch (error) {
      results.discussions.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Discussions sync failed:', error);
    }

    const allSucceeded = results.proposals.success && results.prs.success && results.discussions.success;

    return NextResponse.json({
      success: allSucceeded,
      message: allSucceeded ? 'All syncs completed' : 'Some syncs failed',
      results,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
