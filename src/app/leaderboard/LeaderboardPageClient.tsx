'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Image from 'next/image';

const TABS = ['All-Time', 'Monthly', 'Weekly'];

const BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  Newcomer: { label: 'Newcomer', color: 'bg-gray-200 text-gray-700' },
  Helper: { label: 'Helper', color: 'bg-blue-100 text-blue-700' },
  Expert: { label: 'Expert', color: 'bg-purple-100 text-purple-700' },
  Legend: { label: 'Legend', color: 'bg-yellow-100 text-yellow-700' },
};

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  name: string;
  username: string;
  college: string;
  avatar?: string;
  badge: string;
  points: number;
  change: number;
  is_current_user?: boolean;
};

async function fetchLeaderboard(period: string): Promise<{ entries: LeaderboardEntry[]; currentUser?: LeaderboardEntry }> {
  const res = await fetch(`/api/leaderboard?period=${period.toLowerCase().replace('-', '_')}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export default function LeaderboardPageClient() {
  const [activeTab, setActiveTab] = useState('All-Time');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', activeTab],
    queryFn: () => fetchLeaderboard(activeTab),
    refetchInterval: 300_000,
  });

  const entries = data?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUser = data?.currentUser;
  const currentUserInTop20 = entries.some((e) => e.is_current_user);

  return (
    <div className="min-h-screen bg-[#0a0a1a] px-4 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 font-medium transition border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))}
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-10">
                {top3[1] && <PodiumCard entry={top3[1]} position={2} delay={100} />}
                {top3[0] && <PodiumCard entry={top3[0]} position={1} delay={0} />}
                {top3[2] && <PodiumCard entry={top3[2]} position={3} delay={200} />}
              </div>
            )}

            {/* Table */}
            {rest.length > 0 && (
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr className="text-gray-400 text-left">
                      <th className="px-4 py-3 font-medium">Rank</th>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">College</th>
                      <th className="px-4 py-3 font-medium">Badge</th>
                      <th className="px-4 py-3 font-medium text-right">Points</th>
                      <th className="px-4 py-3 font-medium text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rest.map((entry) => <LeaderboardRow key={entry.user_id} entry={entry} />)}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty state */}
            {entries.length === 0 && (
              <div className="text-center py-20">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No leaderboard data yet.</p>
                <p className="text-gray-600 text-sm mt-2">Be the first to earn reputation points!</p>
              </div>
            )}

            {/* Current user sticky */}
            {currentUser && !currentUserInTop20 && (
              <div className="mt-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
                <div className="flex items-center gap-3">
                  <span className="text-indigo-400 font-bold w-8 text-center">{currentUser.rank}</span>
                  {currentUser.avatar && (
                    <Image src={currentUser.avatar} alt={currentUser.name} width={36} height={36} className="rounded-full" />
                  )}
                  <div className="flex-1">
                    <span className="text-white font-medium">{currentUser.name}</span>
                    <span className="text-indigo-400 text-xs ml-2">(You)</span>
                  </div>
                  <span className="text-indigo-400 font-bold">{currentUser.points.toLocaleString()} pts</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PodiumCard({ entry, position, delay }: { entry: LeaderboardEntry; position: number; delay: number }) {
  const heights: Record<number, string> = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-2xl">{medals[position]}</div>
      {entry.avatar && (
        <Image src={entry.avatar} alt={entry.name} width={48} height={48} className="rounded-full border-2 border-white/20" />
      )}
      <div className="text-center">
        <p className="text-white font-semibold text-sm">{entry.name}</p>
        <p className="text-indigo-400 font-bold text-sm">{entry.points.toLocaleString()} pts</p>
      </div>
      <div className={`w-20 ${heights[position]} bg-white/10 rounded-t-xl border border-white/10 flex items-center justify-center`}>
        <span className="text-gray-400 font-bold text-lg">#{position}</span>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <tr className={`hover:bg-white/5 transition-colors ${entry.is_current_user ? 'bg-indigo-500/10' : ''}`}>
      <td className="px-4 py-3 text-gray-400 font-medium w-12">{entry.rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {entry.avatar && <Image src={entry.avatar} alt={entry.name} width={32} height={32} className="rounded-full" />}
          <div>
            <span className="text-white font-medium">{entry.name}</span>
            {entry.is_current_user && <span className="text-indigo-400 text-xs ml-1">(You)</span>}
            <p className="text-gray-500 text-xs">@{entry.username}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{entry.college}</td>
      <td className="px-4 py-3"><BadgeChip badge={entry.badge} /></td>
      <td className="px-4 py-3 text-right text-white font-bold">{entry.points.toLocaleString()}</td>
      <td className="px-4 py-3 text-right"><ChangeIndicator change={entry.change} /></td>
    </tr>
  );
}

function BadgeChip({ badge }: { badge: string }) {
  const config = BADGE_CONFIG[badge] ?? { label: badge, color: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
}

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) return <span className="flex items-center justify-end gap-1 text-green-400 text-xs"><TrendingUp className="w-3 h-3" />+{change}</span>;
  if (change < 0) return <span className="flex items-center justify-end gap-1 text-red-400 text-xs"><TrendingDown className="w-3 h-3" />{change}</span>;
  return <span className="flex items-center justify-end gap-1 text-gray-500 text-xs"><Minus className="w-3 h-3" /></span>;
}
