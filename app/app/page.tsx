'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SIMDCard from '@/components/SIMDCard';
import { getAllSIMDs } from '@/lib/queries';
import { SIMD } from '@/types';

type FilterType = 'all' | 'open' | 'merged' | 'discussed';
type SortType = 'activity' | 'messages';

export default function AppPage() {
  const [simds, setSIMDs] = useState<SIMD[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('activity');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getAllSIMDs();
      setSIMDs(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const getFilteredSIMDs = (): SIMD[] => {
    let filtered = [...simds];

    switch (filter) {
      case 'open':
        filtered = filtered.filter(s => s.status === 'active' || s.status === 'draft');
        break;
      case 'merged':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(
          s => s.status === 'merged' && new Date(s.last_activity_at) >= thirtyDaysAgo
        );
        break;
      case 'discussed':
        filtered = filtered.filter(s => (s.message_count || 0) > 10);
        break;
    }

    if (sort === 'messages') {
      filtered.sort((a, b) => (b.message_count || 0) - (a.message_count || 0));
    } else {
      filtered.sort((a, b) =>
        new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
      );
    }

    return filtered;
  };

  const newestSIMD = simds.length > 0 ? simds.reduce((newest, current) => {
    const newestDate = new Date(newest.proposal_updated_at);
    const currentDate = new Date(current.proposal_updated_at);
    return currentDate > newestDate ? current : newest;
  }, simds[0]) : null;

  const filteredSIMDs = getFilteredSIMDs();

  if (loading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-solana-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading SIMDs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Newest SIMD */}
        {newestSIMD && (
          <section className="mb-12">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-solana-purple/20 via-solana-dark to-solana-green/20 border border-solana-purple/30 p-8">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-solana-purple/20 via-transparent to-transparent"></div>

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-solana-green/20 text-solana-green text-sm font-medium border border-solana-green/30">
                    Latest Proposal
                  </span>
                  <span className="text-gray-400 text-sm">
                    Proposed {new Date(newestSIMD.proposal_updated_at).toLocaleDateString()}
                  </span>
                </div>

                <Link href={`/simd/${newestSIMD.id}`}>
                  <h2 className="text-3xl font-bold text-white mb-3 hover:text-solana-green transition-colors">
                    SIMD-{newestSIMD.id}: {newestSIMD.title}
                  </h2>
                </Link>

                {newestSIMD.summary && (
                  <p className="text-gray-300 text-lg mb-6 max-w-3xl">
                    {newestSIMD.summary}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  {newestSIMD.topics?.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1 rounded-lg bg-white/10 text-white text-sm border border-white/20"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filters and Sort */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">All SIMDs</h1>
              <p className="text-gray-400">
                {filteredSIMDs.length} {filteredSIMDs.length === 1 ? 'proposal' : 'proposals'}
              </p>
            </div>

            <div className="flex gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-solana-purple"
              >
                <option value="all">All</option>
                <option value="open">Open PRs</option>
                <option value="merged">Merged (30d)</option>
                <option value="discussed">Most Discussed</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-solana-purple"
              >
                <option value="activity">Latest Activity</option>
                <option value="messages">Most Messages</option>
              </select>
            </div>
          </div>

          {/* SIMD List */}
          <div className="grid gap-4">
            {filteredSIMDs.map((simd) => (
              <SIMDCard key={simd.id} simd={simd} />
            ))}

            {filteredSIMDs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No SIMDs found matching your filters.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
