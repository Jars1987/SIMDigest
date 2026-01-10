'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SIMDCard from '@/components/SIMDCard';
import DatabaseError from '@/components/DatabaseError';
import { getMergedSIMDs, getOpenProposalPRs, getSIMDDiscussions } from '@/lib/queries';
import { SIMD, OpenPRFeed, SIMDDiscussion } from '@/types';

type TabType = 'current' | 'merged' | 'discussions';

export default function AppPage() {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [mergedSIMDs, setMergedSIMDs] = useState<SIMD[]>([]);
  const [openPRs, setOpenPRs] = useState<OpenPRFeed[]>([]);
  const [discussions, setDiscussions] = useState<SIMDDiscussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [merged, prs, discs] = await Promise.all([
        getMergedSIMDs(200),  // Fetch all merged proposals (increased from 50)
        getOpenProposalPRs(100),  // Fetch all open PRs (increased from 50)
        getSIMDDiscussions(100),  // Fetch all discussions (increased from 50)
      ]);
      setMergedSIMDs(merged);
      setOpenPRs(prs);
      setDiscussions(discs);
      setLoading(false);
    }
    fetchData();
  }, []);

  const newestSIMD = mergedSIMDs.length > 0 ? mergedSIMDs[0] : null;

  if (loading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-solana-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading SIMD lifecycle feeds...</p>
        </div>
      </div>
    );
  }

  // Show error if database is unavailable (all queries returned empty)
  if (!loading && mergedSIMDs.length === 0 && openPRs.length === 0 && discussions.length === 0) {
    return <DatabaseError />;
  }

  return (
    <div className="min-h-screen py-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Hero Section - Newest SIMD */}
        {newestSIMD && (
          <section className="mb-8 sm:mb-12">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-solana-purple/20 via-solana-dark to-solana-green/20 border border-solana-purple/30 p-4 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-solana-purple/20 via-transparent to-transparent"></div>

              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                  <span className="px-2 sm:px-3 py-1 rounded-full bg-solana-green/20 text-solana-green text-xs sm:text-sm font-medium border border-solana-green/30">
                    Latest Merged
                  </span>
                  <span className="text-gray-400 text-xs sm:text-sm">
                    {new Date(newestSIMD.proposal_updated_at).toLocaleDateString()}
                  </span>
                </div>

                <h2 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 break-words">
                  SIMD-{newestSIMD.id}: {newestSIMD.title}
                </h2>

                {newestSIMD.summary && (
                  <p className="text-gray-300 text-sm sm:text-lg mb-4 sm:mb-6 line-clamp-3 sm:line-clamp-none">
                    {newestSIMD.summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <span className="px-2 sm:px-3 py-1 rounded-full bg-solana-purple/20 text-solana-purple/90 border border-solana-purple/30 text-xs font-medium">
                    {newestSIMD.status}
                  </span>
                  {newestSIMD.topics?.slice(0, 2).map((topic) => (
                    <span
                      key={topic}
                      className="px-2 sm:px-3 py-1 rounded-lg bg-white/10 text-white text-xs sm:text-sm border border-white/20"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/simd/${newestSIMD.id}`}
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-solana-purple text-white text-sm sm:text-base font-medium hover:bg-solana-purple/80 transition-colors"
                >
                  View Details
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="border-b border-white/10">
            <nav className="flex gap-2 sm:gap-8 overflow-x-auto pb-px">
              <button
                onClick={() => setActiveTab('current')}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'current'
                    ? 'border-solana-purple text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                Current
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-solana-green/20 text-solana-green text-xs">
                  {openPRs.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('merged')}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'merged'
                    ? 'border-solana-purple text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                Merged
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-solana-purple/20 text-solana-purple text-xs">
                  {mergedSIMDs.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('discussions')}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'discussions'
                    ? 'border-solana-purple text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                Discussions
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                  {discussions.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {/* Current Proposals Tab */}
          {activeTab === 'current' && (
            <section className="w-full max-w-full">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Current Proposals</h2>
                <p className="text-gray-400 text-sm sm:text-base">
                  Active pull requests for SIMD proposals
                </p>
              </div>

              <div className="grid gap-4 w-full">
                {openPRs.map((pr) => (
                  <Link
                    key={pr.pr_id}
                    href={`/simd/${pr.simd_id}`}
                    className="block bg-white/5 rounded-xl border border-white/10 hover:border-solana-purple/50 transition-all p-4 sm:p-6 cursor-pointer w-full max-w-full overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-xl font-semibold text-white break-words max-w-full">
                            SIMD-{pr.simd_id}: {pr.simd_title || pr.pr_title}
                          </h3>
                          <span className="px-2 py-1 rounded-md bg-solana-green/20 text-solana-green text-xs font-medium border border-solana-green/30 shrink-0">
                            OPEN
                          </span>
                        </div>

                        {pr.summary && (
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{pr.summary}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                          <span>PR #{pr.pr_number}</span>
                          {pr.author && (
                            <span>by <span className="text-white">{pr.author}</span></span>
                          )}
                          {pr.last_commit_at && (
                            <span className="hidden sm:inline">
                              Last commit: {new Date(pr.last_commit_at).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            💬 {pr.total_comments}
                          </span>
                        </div>

                        {pr.reviewer_logins && pr.reviewer_logins.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-sm text-gray-400">Reviewers:</span>
                            <div className="flex flex-wrap gap-2">
                              {pr.reviewer_logins.slice(0, 3).map((reviewer) => (
                                <span
                                  key={reviewer}
                                  className="px-2 py-1 rounded bg-white/10 text-xs text-white"
                                >
                                  {reviewer}
                                </span>
                              ))}
                              {pr.reviewer_logins.length > 3 && (
                                <span className="px-2 py-1 rounded bg-white/10 text-xs text-gray-400">
                                  +{pr.reviewer_logins.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="sm:ml-4 px-4 py-2 rounded-lg bg-solana-purple/20 text-solana-purple border border-solana-purple/30 hover:bg-solana-purple/30 transition-colors text-sm font-medium text-center sm:shrink-0">
                        Details →
                      </div>
                    </div>
                  </Link>
                ))}

                {openPRs.length === 0 && (
                  <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-gray-400">No open proposal PRs at the moment.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Merged Proposals Tab */}
          {activeTab === 'merged' && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Merged Proposals</h2>
                <p className="text-gray-400 text-sm sm:text-base">
                  Proposals merged into main/proposals/
                </p>
              </div>

              <div className="grid gap-4 w-full">
                {mergedSIMDs.map((simd) => (
                  <SIMDCard key={simd.id} simd={simd} />
                ))}

                {mergedSIMDs.length === 0 && (
                  <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-gray-400">No merged proposals yet.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Discussions Tab */}
          {activeTab === 'discussions' && (
            <section className="w-full max-w-full">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">SIMD Discussions</h2>
                <p className="text-gray-400 text-sm sm:text-base">
                  Community discussions and ideation
                </p>
              </div>

              <div className="grid gap-4 w-full">
                {discussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    className="bg-white/5 rounded-xl border border-white/10 hover:border-solana-purple/50 transition-all p-4 sm:p-6 w-full max-w-full overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start gap-2 sm:gap-3 mb-2">
                          <a
                            href={discussion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base sm:text-lg font-semibold text-white hover:text-solana-green transition-colors break-words"
                          >
                            {discussion.title}
                          </a>
                          {discussion.simd_id && (
                            <Link
                              href={`/simd/${discussion.simd_id}`}
                              className="px-2 py-1 rounded-md bg-solana-purple/20 text-solana-purple text-xs font-medium border border-solana-purple/30 hover:bg-solana-purple/30 transition-colors shrink-0"
                            >
                              SIMD-{discussion.simd_id}
                            </Link>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                          <span>#{discussion.discussion_number}</span>
                          {discussion.author && (
                            <span>by <span className="text-white">{discussion.author}</span></span>
                          )}
                          <span className="hidden sm:inline">
                            Updated {new Date(discussion.updated_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            💬 {discussion.comment_count}
                          </span>
                          <span className="px-2 py-1 rounded bg-white/10 text-xs">
                            {discussion.category_slug}
                          </span>
                        </div>
                      </div>

                      <a
                        href={discussion.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm:ml-4 px-4 py-2 rounded-lg bg-solana-purple/20 text-solana-purple border border-solana-purple/30 hover:bg-solana-purple/30 transition-colors text-sm font-medium text-center sm:shrink-0"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                ))}

                {discussions.length === 0 && (
                  <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-gray-400">No discussions found.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
