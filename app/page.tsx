'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const { subscribeEmail } = await import('@/lib/queries');
      const result = await subscribeEmail(email);

      if (result.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-solana-purple/20 via-solana-dark to-solana-green/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-solana-purple/10 via-transparent to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-solana bg-clip-text text-transparent">
                Track Every SIMD
              </span>
              <br />
              <span className="text-white">In Real-Time</span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Stay updated on Solana Improvement Documents with live activity tracking,
              detailed proposals, and weekly digests delivered to your inbox.
            </p>

            {/* Subscribe Form */}
            <div id="subscribe" className="max-w-md mx-auto mb-8">
              <form onSubmit={handleSubscribe} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-solana-purple/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-solana-purple"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-6 py-3 bg-gradient-solana rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>

              {status === 'success' && (
                <p className="mt-3 text-solana-green text-sm">
                  Successfully subscribed! Check your email to confirm.
                </p>
              )}
              {status === 'error' && (
                <p className="mt-3 text-red-400 text-sm">
                  Something went wrong. Please try again.
                </p>
              )}
            </div>

            <Link
              href="/app"
              className="inline-flex items-center space-x-2 text-lg text-solana-green hover:text-solana-blue transition-colors"
            >
              <span>Check recent updates</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            {/* Donation Banner */}
            <div className="mt-12 max-w-2xl mx-auto p-6 rounded-xl bg-gradient-to-r from-solana-purple/10 to-solana-green/10 border border-solana-purple/30">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-solana-purple/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-solana-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Support This Free Service</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    AI-powered summaries are funded out-of-pocket to keep the Solana community informed.
                    If you find this helpful, consider supporting with a small donation.
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                    <code className="flex-1 text-xs text-solana-green font-mono break-all">
                      NbtprKrcGxbHBEK8dCQTnSdYEd2cxQaEEkrLmMbMvpF
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('NbtprKrcGxbHBEK8dCQTnSdYEd2cxQaEEkrLmMbMvpF');
                      }}
                      className="px-3 py-1.5 bg-solana-purple/20 hover:bg-solana-purple/30 text-solana-purple text-xs rounded-md transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-solana-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-white/5 border border-solana-purple/20 hover:border-solana-purple/40 transition-colors">
              <div className="w-12 h-12 bg-gradient-solana rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Live Activity Tracking</h3>
              <p className="text-gray-400">
                Real-time updates on all SIMD proposals, discussions, and status changes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-solana-green/20 hover:border-solana-green/40 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-solana-green to-solana-blue rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Detailed Proposals</h3>
              <p className="text-gray-400">
                Full proposal text, summaries, topics, and conclusions in one place.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-solana-blue/20 hover:border-solana-blue/40 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-solana-blue to-solana-purple rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Weekly Digest</h3>
              <p className="text-gray-400">
                Get the most active and important SIMDs delivered to your inbox every week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Never Miss an Important Update
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of Solana developers and validators staying informed about protocol improvements.
          </p>
          <Link
            href="/app"
            className="inline-block px-8 py-4 bg-gradient-solana rounded-lg text-white font-medium text-lg hover:opacity-90 transition-opacity"
          >
            Explore SIMDs Now
          </Link>
        </div>
      </section>
    </div>
  );
}
