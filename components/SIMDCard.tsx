import Link from 'next/link';
import { SIMD } from '@/types';

interface SIMDCardProps {
  simd: SIMD;
}

export default function SIMDCard({ simd }: SIMDCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

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

  return (
    <Link href={`/simd/${simd.id}`}>
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-solana-purple/50 transition-all hover:shadow-lg hover:shadow-solana-purple/20 group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-solana-purple font-bold">
              SIMD-{simd.id}
            </span>
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(simd.status)}`}>
              {simd.status}
            </span>
          </div>
          <span className="text-sm text-gray-400">
            {formatDate(simd.last_activity_at)}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-solana-green transition-colors">
          {simd.title}
        </h3>

        {simd.summary && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {simd.summary}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {simd.topics?.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="px-2 py-1 rounded-md bg-solana-purple/10 text-solana-purple text-xs"
              >
                {topic}
              </span>
            ))}
          </div>

          {simd.message_count !== undefined && (
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{simd.message_count}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
