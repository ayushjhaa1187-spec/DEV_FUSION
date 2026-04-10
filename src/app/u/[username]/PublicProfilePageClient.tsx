'use client';

import { useEffect, useState } from 'react';
import ReputationBadge from '@/components/user/ReputationBadge';
import { LoadingPage } from '@/components/ui/Loading';
import { Link as LinkIcon, ExternalLink, Globe, Award, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

function StreakHeatmap({ events }: { events: any[] }) {
  const days = Array.from({ length: 140 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (139 - i));
    const dayStr = date.toISOString().split('T')[0];
    const hasEvent = events.some(e => e.created_at.startsWith(dayStr));
    return { date: dayStr, active: hasEvent };
  });

  return (
    <div className="bg-[#13132b] p-6 rounded-3xl border border-white/5">
      <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm font-bold uppercase tracking-wider">
        <Calendar size={16} />
        Contribution Heatmap
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {days.map((day, i) => (
          <div 
            key={i}
            title={day.date}
            className={`w-3 h-3 rounded-[2px] transition-all duration-500 ${
              day.active ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-4 text-[10px] text-gray-500 font-bold uppercase">
        <span>4 Months Ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default function PublicProfilePageClient({ username }: { username: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${username}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <LoadingPage text="Loading profile..." />;
  if (!data?.profile) return <div className="sb-page text-center py-20">User not found</div>;

  const { profile, stats, badges, reputationEvents } = data;

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Identity */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#13132b] p-8 rounded-[40px] border border-white/5 text-center"
            >
              <div className="w-32 h-32 mx-auto mb-6 relative">
                 <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20" />
                 {profile.avatar_url ? (
                   <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover relative border-4 border-[#13132b]" alt="" />
                 ) : (
                   <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-black relative">
                     {profile.username?.[0].toUpperCase()}
                   </div>
                 )}
              </div>
              <h1 className="text-2xl font-black mb-1">{profile.full_name || `@${profile.username}`}</h1>
              <p className="text-indigo-400 font-bold mb-4">@{profile.username}</p>
              <ReputationBadge points={profile.reputation_points} />
              
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/5">
                <div>
                  <div className="text-xl font-black">{stats.doubts}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Doubts</div>
                </div>
                <div>
                  <div className="text-xl font-black">{stats.answers}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Answers</div>
                </div>
                <div>
                  <div className="text-xl font-black text-emerald-400">{stats.accepted}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Solved</div>
                </div>
              </div>
            </motion.div>

            <div className="bg-[#13132b] p-8 rounded-[40px] border border-white/5">
              <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest mb-4">About</h3>
              <p className="text-gray-400 leading-relaxed text-sm mb-6">
                {profile.bio || "This learner hasn't added a bio yet. They are busy solving engineering challenges!"}
              </p>
              <div className="space-y-3">
                 {profile.college && <div className="text-sm font-bold text-gray-300">🏢 {profile.college}</div>}
                 {profile.branch && <div className="text-sm font-bold text-gray-300">📚 {profile.branch}</div>}
              </div>
              <div className="flex gap-4 mt-8">
                {profile.github_url && <a href={profile.github_url} className="text-gray-500 hover:text-white transition-colors"><LinkIcon size={20} /></a>}
                {profile.linkedin_url && <a href={profile.linkedin_url} className="text-gray-500 hover:text-white transition-colors"><ExternalLink size={20} /></a>}
                {profile.website_url && <a href={profile.website_url} className="text-gray-500 hover:text-white transition-colors"><Globe size={20} /></a>}
              </div>
            </div>
          </div>

          {/* Right Column: Activity & Badges */}
          <div className="lg:col-span-2 space-y-8">
            <StreakHeatmap events={reputationEvents} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Badges */}
              <div className="bg-[#13132b] p-8 rounded-[40px] border border-white/5">
                <div className="flex items-center gap-2 mb-6 text-xs font-black uppercase text-indigo-500 tracking-widest">
                  <Award size={16} />
                  Achievements
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {badges.map((badge: any) => (
                    <div key={badge.name} className="relative group" title={badge.description}>
                      <div className="text-3xl grayscale group-hover:grayscale-0 transition-all active:scale-95 cursor-help">
                        {badge.icon || '🏅'}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                        {badge.name}
                      </div>
                    </div>
                  ))}
                  {badges.length === 0 && <p className="text-gray-600 text-sm">No badges earned yet.</p>}
                </div>
              </div>

              {/* Leaderboard Rank */}
              <div className="bg-[#13132b] p-8 rounded-[40px] border border-white/5 flex flex-col justify-center items-center">
                <TrendingUp size={40} className="text-indigo-500 mb-4" />
                <div className="text-4xl font-black">#42</div>
                <div className="text-xs font-black uppercase text-gray-500 tracking-tighter">Global Rank</div>
              </div>
            </div>

            {/* Reputation History */}
            <div className="bg-[#13132b] p-8 rounded-[40px] border border-white/5">
               <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest mb-6">Recent Reputation Events</h3>
               <div className="space-y-4">
                 {reputationEvents.slice(0, 5).map((event: any, i: number) => (
                   <div key={i} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
                     <div className="flex items-center gap-4">
                       <span className={`w-2 h-2 rounded-full ${event.points > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                       <span className="text-sm font-bold text-gray-300">{event.action_type.replace(/_/g, ' ')}</span>
                     </div>
                     <span className={`font-black ${event.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                       {event.points > 0 ? '+' : ''}{event.points}
                     </span>
                   </div>
                 ))}
                 {reputationEvents.length === 0 && <p className="text-gray-600 text-sm">No recent activity.</p>}
               </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
