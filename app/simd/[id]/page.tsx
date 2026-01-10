import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getSIMDById, getSIMDMessages, getProposalContent, getSIMDPRs, getSIMDReviewers, getSIMDPRSummary } from '@/lib/queries';
import PRDiscussionSummary from '@/components/PRDiscussionSummary';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SIMDDetailPage({ params }: PageProps) {
  const { id } = await params;
  const simd = await getSIMDById(id);

  if (!simd) {
    notFound();
  }

  const [messages, proposalContent, prs, reviewers] = await Promise.all([
    getSIMDMessages(id),
    getProposalContent(id),
    getSIMDPRs(id),
    getSIMDReviewers(id),
  ]);

  // Get PR summary if this is a PR-only SIMD or has open PRs
  const openPR = prs.find(pr => pr.state === 'open');
  const prSummary = openPR ? await getSIMDPRSummary(id, openPR.pr_number) : null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'idea':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'review':
        return 'bg-solana-blue/20 text-solana-blue border-solana-blue/30';
      case 'accepted':
        return 'bg-solana-green/20 text-solana-green border-solana-green/30';
      case 'implemented':
        return 'bg-solana-purple/20 text-solana-purple border-solana-purple/30';
      case 'activated':
        return 'bg-green-400/20 text-green-400 border-green-400/30';
      case 'living':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'stagnant':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'withdrawn':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPRStatusBadge = (pr: any) => {
    if (pr.merged_at) {
      return (
        <span className="px-2 py-1 rounded-md bg-solana-purple/20 text-solana-purple text-xs font-medium border border-solana-purple/30">
          MERGED
        </span>
      );
    } else if (pr.state === 'closed') {
      return (
        <span className="px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/30">
          CLOSED
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-md bg-solana-green/20 text-solana-green text-xs font-medium border border-solana-green/30">
          OPEN
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Determine proposal link based on source
  const proposalLink = simd.main_proposal_path
    ? `https://github.com/solana-foundation/solana-improvement-documents/blob/main/${simd.main_proposal_path}`
    : prs.length > 0 && prs[0].html_url
    ? prs[0].html_url
    : null;

  // For PR-only SIMDs, use the PR link
  const githubLinkText = simd.source_stage === 'pr'
    ? 'View PR on GitHub'
    : simd.main_proposal_path
    ? 'View Proposal on GitHub'
    : 'View Draft PR on GitHub';

  // Get the latest PR for mobile header info
  const latestPR = prs.length > 0 ? prs[0] : null;

  return (
    <div className="min-h-screen py-4 sm:py-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8 w-full max-w-full overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <span className="text-base sm:text-lg font-mono text-solana-purple font-bold">
              SIMD-{simd.id}
            </span>
            <span className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium border ${getStatusColor(simd.status)}`}>
              {simd.status}
            </span>
            {simd.source_stage === 'pr' && (
              <span className="px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium border bg-blue-500/20 text-blue-400 border-blue-500/30">
                PR-only
              </span>
            )}
            {/* Mobile GitHub Link */}
            {proposalLink && (
              <a
                href={proposalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="lg:hidden flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">GitHub</span>
              </a>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 break-words">{simd.title}</h1>

          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
            <div className="flex items-center gap-1 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Last: {formatDate(simd.last_activity_at)}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Proposed: {formatDate(simd.proposal_updated_at)}</span>
            </div>
            {/* Mobile: Last Commit Date */}
            {latestPR?.last_commit_at && (
              <div className="lg:hidden flex items-center gap-1 sm:gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last commit: {formatDate(latestPR.last_commit_at)}</span>
              </div>
            )}
          </div>

          {/* Mobile: Reviewers inline */}
          {reviewers.length > 0 && (
            <div className="lg:hidden mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Reviewers:</span>
              {reviewers.slice(0, 4).map((reviewer) => (
                <a
                  key={reviewer}
                  href={`https://github.com/${reviewer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded bg-solana-purple/20 text-solana-purple text-xs hover:bg-solana-purple/30 transition-colors"
                >
                  @{reviewer}
                </a>
              ))}
              {reviewers.length > 4 && (
                <span className="text-xs text-gray-400">+{reviewers.length - 4} more</span>
              )}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8 w-full max-w-full overflow-hidden">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-8 min-w-0 w-full max-w-full overflow-hidden">
            {/* Summary */}
            {simd.summary && (
              <section className="p-4 sm:p-6 rounded-xl bg-solana-purple/10 border border-solana-purple/30 w-full max-w-full overflow-hidden">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Summary</h2>
                <p className="text-gray-300 text-sm sm:text-base break-words">{simd.summary}</p>
              </section>
            )}

            {/* Topics */}
            {simd.topics && simd.topics.length > 0 && (
              <section className="w-full max-w-full overflow-hidden">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Topics</h2>
                <div className="flex flex-wrap gap-2">
                  {simd.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Proposal Content */}
            {proposalContent && (
              <section className="p-4 sm:p-8 rounded-xl bg-white/5 border border-white/10 w-full max-w-full overflow-hidden">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Full Proposal</h2>
                <div className="prose prose-invert prose-purple max-w-none max-h-[400px] sm:max-h-[600px] overflow-y-auto overflow-x-auto pr-2 sm:pr-4 w-full">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold text-white mb-4">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-bold text-white mb-3 mt-8">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-bold text-white mb-2 mt-6">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-300">{children}</li>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="px-1.5 py-0.5 rounded bg-solana-purple/20 text-solana-purple font-mono text-sm">
                            {children}
                          </code>
                        ) : (
                          <code className="block p-4 rounded-lg bg-solana-dark border border-white/10 text-solana-green font-mono text-sm overflow-x-auto">
                            {children}
                          </code>
                        );
                      },
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-solana-blue hover:text-solana-green transition-colors underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {proposalContent}
                  </ReactMarkdown>
                </div>
              </section>
            )}

            {/* Conclusion */}
            {simd.conclusion && (
              <section className="p-4 sm:p-6 rounded-xl bg-solana-green/10 border border-solana-green/30 w-full max-w-full overflow-hidden">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Conclusion</h2>
                <p className="text-gray-300 text-sm sm:text-base break-words">{simd.conclusion}</p>
              </section>
            )}

            {/* AI-Generated Discussion Summary */}
            {messages.length > 0 && (
              <PRDiscussionSummary
                messages={messages}
                summary={prSummary}
                isMerged={simd.source_stage === 'main'}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-hidden">
            {/* GitHub Links - Hidden on mobile (shown in header) */}
            <section className="hidden lg:block p-4 sm:p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Links</h3>
              <div className="space-y-3">
                {proposalLink ? (
                  <a
                    href={proposalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-solana-blue hover:text-solana-green transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    <span>{githubLinkText}</span>
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">No proposal document available yet</p>
                )}
              </div>
            </section>

            {/* Related Pull Requests - Hidden on mobile */}
            {prs.length > 0 && (
              <section className="hidden lg:block p-4 sm:p-6 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Pull Requests</h3>
                <div className="space-y-3">
                  {prs.map((pr) => (
                    <div key={pr.id} className="pb-3 border-b border-white/10 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <a
                          href={pr.html_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-white hover:text-solana-green transition-colors flex-1"
                        >
                          #{pr.pr_number}: {pr.pr_title}
                        </a>
                        {getPRStatusBadge(pr)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {pr.author && <span>by {pr.author}</span>}
                        {pr.merged_at && (
                          <span>Merged {formatDate(pr.merged_at)}</span>
                        )}
                        {pr.last_commit_at && !pr.merged_at && (
                          <span>Last commit {formatDate(pr.last_commit_at)}</span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        💬 {pr.issue_comment_count + pr.review_comment_count + pr.review_count} comments
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviewers - Hidden on mobile (shown in header) */}
            {reviewers.length > 0 && (
              <section className="hidden lg:block p-4 sm:p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Reviewers</h3>
                <div className="flex flex-wrap gap-2">
                  {reviewers.map((reviewer) => (
                    <a
                      key={reviewer}
                      href={`https://github.com/${reviewer}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-solana-purple/20 text-solana-purple border border-solana-purple/30 hover:bg-solana-purple/30 transition-colors text-sm"
                    >
                      @{reviewer}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Latest Messages */}
            {messages.length > 0 && (
              <section className="p-4 sm:p-6 rounded-xl bg-white/5 border border-white/10 w-full max-w-full overflow-hidden">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                  Latest Discussion
                  <span className="ml-2 text-xs sm:text-sm font-normal text-gray-400">
                    ({messages.length} of {simd.message_count || messages.length})
                  </span>
                </h3>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="pb-4 border-b border-white/10 last:border-0 last:pb-0 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-medium text-white text-sm">{message.author}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-3 break-words">{message.body}</p>
                      <a
                        href={message.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-solana-blue hover:text-solana-green transition-colors"
                      >
                        View on GitHub →
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
