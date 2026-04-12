'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface DoubtCardProps {
  doubt: {
    id: string;
    title: string;
    content: string;
    votes?: number;
    status?: string;
    created_at: string;
    subjects?: { name: string };
    profiles?: {
      username?: string;
      avatar_url?: string;
      reputation_points?: number;
    };
  };
  onVote?: (id: string, direction: 'up' | 'down') => void;
}

const DoubtCard = memo(function DoubtCard({ doubt, onVote }: DoubtCardProps) {
  return (
    <Link href={`/doubts/${doubt.id}`} className="block rounded-xl bg-white/5 border border-white/10 p-5 hover:border-purple-500/40 transition-all">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {doubt.subjects?.name && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
            {doubt.subjects.name}
          </span>
        )}
        {doubt.status === 'resolved' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            Resolved
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">{doubt.votes ?? 0} votes</span>
      </div>

      <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">{doubt.title}</h3>
      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
        {doubt.content?.substring(0, 150)}...
      </p>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        {doubt.profiles?.avatar_url ? (
          <Image
            src={doubt.profiles.avatar_url || '/default-avatar.png'}
            alt={`${doubt.profiles?.username || 'Learner'}'s avatar`}
            width={24}
            height={24}
            className="rounded-full"
            loading="lazy"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">
            {doubt.profiles?.username?.[0]?.toUpperCase() || 'L'}
          </div>
        )}
        <span>{doubt.profiles?.username || 'Learner'}</span>
        <span className="ml-auto">{new Date(doubt.created_at).toLocaleDateString()}</span>
      </div>
    </Link>
  );
});

export default DoubtCard;
