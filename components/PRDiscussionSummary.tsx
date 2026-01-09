'use client';

import { useState } from 'react';
import { SIMDMessage, SIMDPRSummary } from '@/types';

interface PRDiscussionSummaryProps {
  messages: SIMDMessage[];
  summary: SIMDPRSummary | null;
  isMerged?: boolean;
}

export default function PRDiscussionSummary({ messages, summary, isMerged = false }: PRDiscussionSummaryProps) {
  const [copied, setCopied] = useState(false);

  if (!messages || messages.length === 0) {
    return null;
  }

  const formatMessagesForCopy = () => {
    const formattedMessages = messages
      .map((msg, idx) => {
        const date = new Date(msg.created_at).toLocaleDateString();
        return `Message ${idx + 1} - ${msg.author} (${date}):\n${msg.body}\n`;
      })
      .join('\n---\n\n');

    return `Please summarize this SIMD proposal discussion and highlight key points, technical concerns, and areas of consensus:\n\n${formattedMessages}`;
  };

  const handleCopyMessages = async () => {
    try {
      const textToCopy = formatMessagesForCopy();
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy messages:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  };

  return (
    <section className="p-6 rounded-xl bg-gradient-to-br from-solana-purple/10 to-solana-blue/10 border border-solana-purple/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Discussion Summary</h2>
          {summary && (
            <span className="px-2 py-0.5 rounded-md bg-solana-purple/20 text-solana-purple text-xs font-medium border border-solana-purple/30">
              AI-Generated
            </span>
          )}
        </div>
        <button
          onClick={handleCopyMessages}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-solana-purple/50 transition-colors text-sm text-gray-300 hover:text-white"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy for Your LLM</span>
            </>
          )}
        </button>
      </div>

      {summary ? (
        <>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">{summary.summary}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-3 border-t border-white/10">
            <span>Last updated: {getTimeAgo(summary.generated_at)}</span>
            <span>•</span>
            <span>Based on {summary.message_count} message{summary.message_count !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>Model: {summary.model}</span>
            <span>•</span>
            <span className="text-gray-500">Summaries refresh daily if new activity</span>
          </div>
        </>
      ) : (
        <div className="py-4">
          {isMerged ? (
            <>
              <p className="text-gray-400 mb-3">
                This proposal has been merged and accepted into the main branch.
              </p>
              <p className="text-sm text-gray-500">
                AI summaries are generated for active proposals with ongoing discussions. Since this proposal is finalized, you can review the conversation history in the sidebar or click "Copy for Your LLM" above to generate your own summary.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-400 mb-3">
                AI summary not yet generated for this discussion.
              </p>
              <p className="text-sm text-gray-500">
                Summaries are generated automatically every 24 hours for active PRs. Click "Copy for Your LLM" above to generate your own summary.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
