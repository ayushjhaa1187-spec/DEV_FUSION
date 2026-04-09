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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d1a] p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Leaderboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            <div className="flex justify-center gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-full" />
                  <div className="h-4 w-20 bg-gray-200 dark:bg-white/5 rounded" />
                </div>
              ))}
            </div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 dark:bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-10">
                {top3[1] && <PodiumCard entry={top3[1]} position={2} delay={200} />}
                {top3[0] && <PodiumCard entry={top3[0]} position={1} delay={0} />}
                {top3[2] && <PodiumCard entry={top3[2]} position={3} delay={400} />}
              </div>
            )}

            <div className="bg-white dark:bg-[#13132b] rounded-xl shadow overflow-hidden border border-white/5">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-400">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-400">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-400 hidden sm:table-cell">College</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-400">Badge</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-400">Points</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-400">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {rest.map((entry) => <LeaderboardRow key={entry.user_id} entry={entry} />)}
                </tbody>
              </table>
            </div>

            {currentUser && !currentUserInTop20 && (
              <div className="mt-4 bg-indigo-500/10 rounded-xl p-4 flex items-center gap-4 border-2 border-indigo-400/50">
                <span className="font-bold text-indigo-400 w-10">{currentUser.rank}</span>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden">
                    {currentUser.avatar && <Image src={currentUser.avatar} alt={currentUser.name} width={36} height={36} />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{currentUser.name} <span className="text-indigo-400">(You)</span></p>
                    <p className="text-xs text-gray-500">{currentUser.college}</p>
                  </div>
                </div>
                <BadgeChip badge={currentUser.badge} />
                <span className="font-bold text-gray-900 dark:text-white ml-auto">{currentUser.points.toLocaleString()}</span>
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
    <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="text-3xl">{medals[position]}</div>
      <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden">
        {entry.avatar && <Image src={entry.avatar} alt={entry.name} width={64} height={64} />}
      </div>
      <p className="font-semibold text-gray-900 dark:text-white text-sm text-center">{entry.name}</p>
      <p className="text-xs text-gray-500">{entry.points.toLocaleString()} pts</p>
      <div className={`w-20 ${heights[position]} ${
        position === 1 ? 'bg-yellow-400' : position === 2 ? 'bg-gray-400' : 'bg-orange-400'
      } rounded-t-md`} />
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <tr className={`${
      entry.is_current_user ? 'bg-indigo-500/10 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-white/5'
    } transition`}>
      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{entry.rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
            {entry.avatar && <Image src={entry.avatar} alt={entry.name} width={32} height={32} />}
          </div>
          <span className="text-gray-900 dark:text-white">{entry.name}</span>
          {entry.is_current_user && <span className="text-indigo-400 text-xs">(You)</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{entry.college}</td>
      <td className="px-4 py-3"><BadgeChip badge={entry.badge} /></td>
      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{entry.points.toLocaleString()}</td>
      <td className="px-4 py-3 text-center"><ChangeIndicator change={entry.change} /></td>
    </tr>
  );
}

function BadgeChip({ badge }: { badge: string }) {
  const config = BADGE_CONFIG[badge] ?? { label: badge, color: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
}

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) return <span className="text-green-500 flex items-center justify-center gap-1"><TrendingUp className="w-4 h-4" /> +{change}</span>;
  if (change < 0) return <span className="text-red-500 flex items-center justify-center gap-1"><TrendingDown className="w-4 h-4" /> {change}</span>;
  return <span className="text-gray-400 flex items-center justify-center"><Minus className="w-4 h-4" /></span>;
}
