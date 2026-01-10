import { SIMDMessage, SIMDPRSummary } from '@/types';

interface PRDiscussionSummaryProps {
  messages: SIMDMessage[];
  summary: SIMDPRSummary | null;
  isMerged?: boolean;
}

export default function PRDiscussionSummary({ messages, summary, isMerged = false }: PRDiscussionSummaryProps) {
  if (!messages || messages.length === 0) {
    return null;
  }

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
    <section className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-solana-purple/10 to-solana-blue/10 border border-solana-purple/30 w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-white">Discussion Summary</h2>
        {summary && (
          <span className="px-2 py-0.5 rounded-md bg-solana-purple/20 text-solana-purple text-xs font-medium border border-solana-purple/30">
            AI-Generated
          </span>
        )}
      </div>

      {summary ? (
        <>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap mb-4 break-words">{summary.summary}</p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-400 pt-3 border-t border-white/10">
            <span>Updated: {getTimeAgo(summary.generated_at)}</span>
            <span className="hidden sm:inline">•</span>
            <span>{summary.message_count} message{summary.message_count !== 1 ? 's' : ''}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Model: {summary.model}</span>
          </div>
        </>
      ) : (
        <div className="py-2 sm:py-4">
          {isMerged ? (
            <p className="text-gray-400 text-sm sm:text-base">
              This proposal has been merged. AI summaries are generated for active proposals with ongoing discussions.
            </p>
          ) : (
            <p className="text-gray-400 text-sm sm:text-base">
              AI summary not yet generated. Summaries are created automatically every 24 hours for active PRs.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
