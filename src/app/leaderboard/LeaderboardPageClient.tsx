'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Rocket, Search, UserCheck, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { toast } from 'sonner';

const TABS = ['All-Time', 'Weekly'];

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  name: string;
  username: string;
  college: string;
  avatar_url?: string;
  badge: string;
  points: number;
  change: number;
  recruitment_opt_in: boolean;
  is_current_user?: boolean;
};

async function fetchLeaderboard(period: string): Promise<{ entries: LeaderboardEntry[]; currentUser?: LeaderboardEntry }> {
  const res = await fetch(`/api/leaderboard?period=${period.toLowerCase().replace('-', '_')}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export default function LeaderboardPageClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Weekly');
  const [isOptInLocal, setIsOptInLocal] = useState<boolean | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', activeTab],
    queryFn: () => fetchLeaderboard(activeTab),
    refetchInterval: 60_000,
  });

  const entries = data?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUser = data?.currentUser;

  useEffect(() => {
    if (currentUser) {
      setIsOptInLocal(currentUser.recruitment_opt_in);
    }
  }, [currentUser]);

  const optInMutation = useMutation({
    mutationFn: async (optIn: boolean) => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ recruitment_opt_in: optIn })
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: (response) => {
      const val = response?.data?.recruitment_opt_in;
      setIsOptInLocal(val);
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success(val ? 'Talent discovery enabled! You are now visible to organizations.' : 'Talent discovery disabled.');
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <div className="flex items-center gap-3 text-amber-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
            <Trophy size={16} />
            Global Honor Roll
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            Ecosystem <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Hall of Fame</span>
          </h1>
          <p className="text-gray-500 mt-4 max-w-xl text-sm md:text-base font-medium leading-relaxed">
            The top 1% of contributors powering the SkillBridge reputation economy. Rank is calculated via AI-validated doubt resolution and practice mastery.
          </p>
        </div>

        {/* Talent Discovery Toggle */}
        <div className="bg-[#13132b] p-6 rounded-[32px] border border-white/5 shadow-2xl flex items-center gap-4 border-l-4 border-l-amber-500/50">
           <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
              <Search size={24} />
           </div>
           <div>
              <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">
                 Talent discovery
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-white whitespace-nowrap">Visible to Recruiter Org Hub?</span>
                 <button 
                  onClick={() => optInMutation.mutate(!isOptInLocal)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isOptInLocal ? 'bg-amber-500' : 'bg-white/10'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isOptInLocal ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl w-fit mb-12 border border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-8">
           <div className="h-64 bg-white/5 rounded-[40px] animate-pulse" />
           <div className="space-y-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
           </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="py-24 text-center bg-[#13132b] rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-amber-500/10 opacity-50"></div>
          <Trophy size={48} className="text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-white mb-2">Constellation is Forming</h3>
          <p className="text-gray-400 font-medium max-w-sm mx-auto">No scholars have amassed enough reputation points to chart the leaderboard in this sector yet. Be the first.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-6 mb-20 px-4">
             {/* 2nd Place */}
             {top3[1] && <PodiumItem entry={top3[1]} position={2} color="silver" />}
             {/* 1st Place */}
             {top3[0] && <PodiumItem entry={top3[0]} position={1} color="gold" />}
             {/* 3rd Place */}
             {top3[2] && <PodiumItem entry={top3[2]} position={3} color="bronze" />}
          </div>

          {/* List View */}
          <div className="bg-[#13132b] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                         <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Rank</th>
                         <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Mastery ID</th>
                         <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Institute</th>
                         <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Reputation</th>
                         <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {rest.map((entry) => (
                        <tr 
                          key={entry.user_id} 
                          className={`group hover:bg-white/[0.03] transition-colors ${entry.is_current_user ? 'bg-amber-500/5' : ''}`}
                        >
                           <td className="px-8 py-6">
                              <span className="text-xl font-black text-gray-600 group-hover:text-white transition-colors">#{entry.rank}</span>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 {entry.avatar_url ? (
                                   <Image src={entry.avatar_url} alt={entry.name} width={40} height={40} className="rounded-xl border border-white/10" />
                                 ) : (
                                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                      {entry.name[0]}
                                   </div>
                                 )}
                                 <div>
                                    <div className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors uppercase tracking-tight">
                                      {entry.name} {entry.is_current_user && <span className="text-[10px] text-amber-500 ml-1">(YOU)</span>}
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">@{entry.username}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{entry.college || 'UNAFFILIATED'}</span>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="text-sm font-black text-white">{entry.points.toLocaleString()}</div>
                              <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{entry.badge}</div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              {entry.recruitment_opt_in ? (
                                <div className="flex items-center justify-center gap-1.5 text-emerald-400" title="Open to recruitment">
                                   <ShieldCheck size={14} />
                                   <span className="text-[9px] font-black uppercase tracking-widest">Talent</span>
                                </div>
                              ) : (
                                <div className="text-gray-600 flex items-center justify-center gap-1.5 opacity-30">
                                   <Minus size={14} />
                                </div>
                              )}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </>
      )}
    </div>
  );
}

function PodiumItem({ entry, position, color }: { entry: LeaderboardEntry; position: number; color: 'gold' | 'silver' | 'bronze' }) {
  const colors = {
    gold: 'from-amber-400 via-amber-200 to-amber-500 border-amber-400/50',
    silver: 'from-gray-300 via-gray-100 to-gray-400 border-gray-300/50',
    bronze: 'from-orange-800 via-orange-600 to-orange-900 border-orange-800/50'
  };

  const heights = { 1: 'h-64', 2: 'h-52', 3: 'h-40' };
  const order = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };

  return (
    <div className={`flex flex-col items-center gap-4 ${order[position]}`}>
      <div className="relative group">
        <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} />
        {entry.avatar_url ? (
          <Image 
            src={entry.avatar_url} 
            alt={entry.name} 
            width={position === 1 ? 80 : 64} 
            height={position === 1 ? 80 : 64} 
            className={`rounded-2xl border-2 relative z-10 ${colors[color]}`} 
          />
        ) : (
          <div className={`w-${position === 1 ? '20' : '16'} h-${position === 1 ? '20' : '16'} rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border-2 relative z-10 flex items-center justify-center text-2xl font-black text-white ${colors[color]}`}>
            {entry.name[0]}
          </div>
        )}
        <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center z-20 text-sm`}>
           {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
        </div>
      </div>

      <div className="text-center">
         <div className="font-black text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight text-sm">
            {entry.name}
         </div>
         <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
            {entry.points.toLocaleString()} PTS
         </div>
      </div>

      <div className={`w-full ${heights[position]} bg-gradient-to-b from-white/5 to-transparent rounded-t-3xl border border-white/5 border-b-0 flex items-center justify-center`}>
         <span className="text-3xl font-black text-white/5 uppercase select-none tracking-tighter italic">#{position}</span>
      </div>
    </div>
  );
}
