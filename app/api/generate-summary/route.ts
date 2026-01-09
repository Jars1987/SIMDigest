import { NextRequest, NextResponse } from 'next/server';
import { generateDiscussionSummary } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const summary = await generateDiscussionSummary(messages);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in generate-summary API:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
