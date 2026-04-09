'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface MentorCardProps {
  mentor: {
    id: string;
    profiles?: {
      username?: string;
      full_name?: string;
      avatar_url?: string;
    };
    mentor_profiles?: {
      specialty?: string;
      hourly_rate?: number;
      rating?: number;
      sessions_completed?: number;
      bio?: string;
    };
    reputation_points?: number;
  };
}

const MentorCard = memo(function MentorCard({ mentor }: MentorCardProps) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {mentor.profiles?.avatar_url ? (
          <Image
            src={mentor.profiles.avatar_url || '/default-avatar.png'}
            alt={`${mentor.profiles?.full_name || mentor.profiles?.username || 'Mentor'}'s avatar`}
            width={40}
            height={40}
            className="rounded-full"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
            {(mentor.profiles?.username || 'M')[0].toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-white">
            {mentor.profiles?.full_name || mentor.profiles?.username || 'Expert Mentor'}
          </h3>
          <p className="text-xs text-gray-400">{mentor.mentor_profiles?.specialty || 'General Academic'}</p>
        </div>
        <span className="ml-auto text-xs text-yellow-400">★ {mentor.mentor_profiles?.rating || '5.0'}</span>
      </div>

      <div className="flex gap-3 text-xs text-gray-400">
        <span>Sessions: {mentor.mentor_profiles?.sessions_completed || 0}+</span>
        <span>
          {mentor.mentor_profiles?.hourly_rate === 0
            ? 'Free'
            : `₹${mentor.mentor_profiles?.hourly_rate}/30min`}
        </span>
      </div>

      <div className="flex gap-2 mt-auto">
        <Link
          href={`/mentors/${mentor.id}`}
          className="flex-1 text-center text-xs py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
        >
          View Profile
        </Link>
        <Link
          href={`/mentors/${mentor.id}/book`}
          className="flex-1 text-center text-xs py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          Book Session
        </Link>
      </div>
    </div>
  );
});

export default MentorCard;
