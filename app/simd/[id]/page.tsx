import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getSIMDById, getSIMDMessages, getProposalContent } from '@/lib/queries';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SIMDDetailPage({ params }: PageProps) {
  const { id } = await params;
  const simd = await getSIMDById(id);

  if (!simd) {
    notFound();
  }

  const messages = await getSIMDMessages(id);
  const proposalContent = await getProposalContent(id) || '';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-solana-green/20 text-solana-green border-solana-green/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'merged':
        return 'bg-solana-purple/20 text-solana-purple border-solana-purple/30';
      case 'implemented':
        return 'bg-solana-blue/20 text-solana-blue border-solana-blue/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg font-mono text-solana-purple font-bold">
              SIMD-{simd.id}
            </span>
            <span className={`px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(simd.status)}`}>
              {simd.status}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">{simd.title}</h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Last activity: {formatDate(simd.last_activity_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Proposed: {formatDate(simd.proposal_updated_at)}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary */}
            {simd.summary && (
              <section className="p-6 rounded-xl bg-solana-purple/10 border border-solana-purple/30">
                <h2 className="text-xl font-bold text-white mb-3">Summary</h2>
                <p className="text-gray-300">{simd.summary}</p>
              </section>
            )}

            {/* Topics */}
            {simd.topics && simd.topics.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-3">Topics</h2>
                <div className="flex flex-wrap gap-2">
                  {simd.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Proposal Content */}
            <section className="p-8 rounded-xl bg-white/5 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Full Proposal</h2>
              <div className="prose prose-invert prose-purple max-w-none">
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

            {/* Conclusion */}
            {simd.conclusion && (
              <section className="p-6 rounded-xl bg-solana-green/10 border border-solana-green/30">
                <h2 className="text-xl font-bold text-white mb-3">Conclusion</h2>
                <p className="text-gray-300">{simd.conclusion}</p>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* GitHub Links */}
            <section className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Links</h3>
              <div className="space-y-3">
                <a
                  href={`https://github.com/solana-foundation/solana-improvement-documents/blob/main/${simd.proposal_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-solana-blue hover:text-solana-green transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span>View Proposal on GitHub</span>
                </a>
                <a
                  href="https://github.com/solana-foundation/solana-improvement-documents/pulls"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-solana-blue hover:text-solana-green transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Related Pull Requests</span>
                </a>
              </div>
            </section>

            {/* Latest Messages */}
            {messages.length > 0 && (
              <section className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Latest Discussion</h3>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="pb-4 border-b border-white/10 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-white">{message.author}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-3">{message.body}</p>
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
