'use client';

import { useEffect, useState, useCallback } from 'react';
import ReputationBadge from '@/components/user/ReputationBadge';
import { LoadingPage } from '@/components/ui/Loading';
import { 
  Link as LinkIcon, ExternalLink, Globe, Award, 
  TrendingUp, Calendar, Github, Linkedin, Twitter,
  Users, MessageSquare, CheckCircle2, UserPlus, UserCheck,
  ShieldCheck, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';

function StreakHeatmap({ events }: { events: any[] }) {
  const days = Array.from({ length: 140 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (139 - i));
    const dayStr = date.toISOString().split('T')[0];
    const hasEvent = events?.some(e => e.created_at.startsWith(dayStr));
    return { date: dayStr, active: hasEvent };
  });

  return (
    <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4 text-gray-500 text-[10px] font-black uppercase tracking-widest">
        <Calendar size={14} className="text-indigo-400" />
        Activity Heatmap
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {days.map((day, i) => (
          <div 
            key={i}
            title={day.date}
            className={`w-[10px] h-[10px] rounded-[2px] transition-all duration-300 ${
              day.active ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-white/5'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-4 text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
        <span>140 Days Ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default function PublicProfilePageClient({ username }: { username: string }) {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'doubts' | 'answers' | 'availability'>('doubts');

  const fetchProfile = useCallback(() => {
    fetch(`/api/profile/${username}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setIsFollowing(d.stats?.isFollowing || false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    if (!currentUser) {
      alert('Please sign in to follow users');
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/profile/${username}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST'
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setData((prev: any) => ({
          ...prev,
          stats: {
            ...prev.stats,
            followersCount: isFollowing ? prev.stats.followersCount - 1 : prev.stats.followersCount + 1
          }
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <LoadingPage text="Deciphering identity..." />;
  if (!data?.profile) return <div className="sb-page text-center py-20 text-gray-500 font-bold">404: IDENTITY NOT FOUND</div>;

  const { profile, stats, badges, doubts, answers } = data;
  const isSelf = currentUser?.id === profile.id;

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const hasAvailability = profile.role === 'mentor' && profile.availability && Object.values(profile.availability).some((v: any) => v.length > 0);

  return (
    <main className="min-h-screen bg-[#06060f] selection:bg-indigo-500/30">
      {/* Profile Header Banner */}
      <div className="h-64 bg-gradient-to-r from-indigo-900 via-indigo-950 to-black relative overflow-hidden text-white">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06060f] to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10 pb-24 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Identity Card (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0c0c16]/80 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              
              <div className="relative mb-8 pt-4">
                 <div className="w-32 h-32 mx-auto relative group">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-[#0c0c16] relative z-10 bg-indigo-600/20">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.full_name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-indigo-400">
                          {profile.username?.[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                 </div>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-white mb-1 tracking-tight">{profile.full_name || `@${profile.username}`}</h1>
                <p className="text-indigo-400 font-bold text-sm mb-4">@{profile.username}</p>
                
                <div className="flex justify-center mb-6">
                   <ReputationBadge points={profile.reputation_points} />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                  <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-lg font-black">{stats.followersCount}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Followers</div>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-lg font-black">{stats.followingCount}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Following</div>
                  </div>
                </div>

                {!isSelf && (
                  <button 
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`w-full py-4 rounded-2xl font-black tracking-tight transition-all flex items-center justify-center gap-2 group ${
                      isFollowing 
                      ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95'
                    }`}
                  >
                    {followLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : isFollowing ? (
                      <><UserCheck size={18} /> Following</>
                    ) : (
                      <><UserPlus size={18} /> Follow</>
                    )}
                  </button>
                )}
                {isSelf && (
                  <Link 
                    href="/settings"
                    className="w-full py-4 bg-white/5 text-gray-300 border border-white/10 rounded-2xl font-black tracking-tight hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    Edit Profile Details
                  </Link>
                )}
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <ShieldCheck size={16} className="text-indigo-400" />
                  <span className="font-bold text-indigo-300/80 uppercase tracking-widest">{profile.role}</span>
                </div>
                {profile.college && (
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500">🏢</div>
                    <span className="font-medium">{profile.college}</span>
                  </div>
                )}
                {profile.branch && (
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500">📚</div>
                    <span className="font-medium">{profile.branch} (Sem {profile.semester})</span>
                  </div>
                )}
              </div>

              {profile.subjects?.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/5">
                   <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">Expertise Nodes</div>
                   <div className="flex flex-wrap gap-2">
                     {profile.subjects.map((s: string) => (
                       <span key={s} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-tight rounded-md border border-indigo-500/20">
                         {s}
                       </span>
                     ))}
                   </div>
                </div>
              )}

              <div className="flex justify-center gap-3 mt-8">
                {profile.twitter_url && <a href={profile.twitter_url} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-sky-500/10 hover:text-sky-400 transition-all border border-white/5"><Twitter size={18} /></a>}
                {profile.github_url && <a href={profile.github_url} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all border border-white/5"><Github size={18} /></a>}
                {profile.linkedin_url && <a href={profile.linkedin_url} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-blue-600/10 hover:text-blue-500 transition-all border border-white/5"><Linkedin size={18} /></a>}
                {profile.website_url && <a href={profile.website_url} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-emerald-500/10 hover:text-emerald-400 transition-all border border-white/5"><Globe size={18} /></a>}
              </div>
            </motion.div>

            {/* Badges Widget */}
            <div className="bg-[#0c0c16]/50 p-8 rounded-[3rem] border border-white/5">
              <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest mb-6 flex items-center gap-2">
                <Award size={14} /> Major Achievements
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {badges?.map((badge: any) => (
                  <div key={badge.name} className="relative group flex flex-col items-center">
                    <div className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all cursor-help">
                      {badge.icon || '🏅'}
                    </div>
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 text-[10px] font-bold p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all w-48 text-center pointer-events-none shadow-2xl z-50">
                      <div className="text-indigo-400 mb-1">{badge.name}</div>
                      <div className="text-gray-500 leading-tight font-medium">{badge.description}</div>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-white/10 rotate-45" />
                    </div>
                  </div>
                ))}
                {badges?.length === 0 && <p className="col-span-4 text-center py-4 text-gray-600 text-xs font-bold italic uppercase">No artifacts found</p>}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Activity & Content (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <StreakHeatmap events={answers} />
               <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-center items-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp size={32} className="text-indigo-500 mb-2 opacity-50" />
                  <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Impact Rank</div>
                  <div className="text-5xl font-black text-white">{stats.rank}</div>
                  <div className="mt-2 text-[10px] text-indigo-400/60 font-black uppercase tracking-tighter">Elite Contributor Node</div>
               </div>
            </div>

            {/* Bio Section */}
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 leading-relaxed">
              <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4">Transmission Transcribed</h3>
              <p className="text-gray-300 text-lg font-medium italic">
                {profile.bio ? `"${profile.bio}"` : '"Identity file incomplete. User is likely optimizing learning algorithms."'}
              </p>
            </div>

            {/* TABBED ACTIVITY FEED */}
            <div className="bg-[#0c0c16] rounded-[3rem] border border-white/5 min-h-[500px] flex flex-col overflow-hidden shadow-2xl">
               <div className="flex border-b border-white/5 p-2 bg-white/2 backdrop-blur-md">
                  <button 
                    onClick={() => setActiveTab('doubts')}
                    className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                      activeTab === 'doubts' ? 'bg-white/5 text-white' : 'text-gray-600 hover:text-gray-300'
                    }`}
                  >
                    <MessageSquare size={14} /> Doubts
                  </button>
                  <button 
                    onClick={() => setActiveTab('answers')}
                    className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                      activeTab === 'answers' ? 'bg-white/5 text-white' : 'text-gray-600 hover:text-gray-300'
                    }`}
                  >
                    <CheckCircle2 size={14} /> Answers
                  </button>
                  {profile.role === 'mentor' && (
                    <button 
                      onClick={() => setActiveTab('availability')}
                      className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                        activeTab === 'availability' ? 'bg-white/5 text-white' : 'text-gray-600 hover:text-gray-300'
                      }`}
                    >
                      <Calendar size={14} /> Availability
                    </button>
                  )}
               </div>

               <div className="flex-1 p-8">
                  {activeTab === 'doubts' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {doubts?.map((d: any) => (
                        <Link key={d.id} href={`/doubts/${d.id}`} className="block p-6 bg-white/2 rounded-3xl border border-white/5 hover:border-indigo-500/30 group transition-all">
                          <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-gray-300 group-hover:text-white transition-colors">{d.title}</h4>
                             <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${d.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                               {d.status}
                             </span>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                            <span>{new Date(d.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="text-indigo-400">{d.subjects?.name || 'General'}</span>
                            <span>•</span>
                            <span>{d.votes} votes</span>
                          </div>
                        </Link>
                      ))}
                      {doubts?.length === 0 && <div className="text-center py-20 text-gray-700 font-bold uppercase text-xs tracking-widest opacity-30">No Data transmissions</div>}
                    </motion.div>
                  )}

                  {activeTab === 'answers' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {answers?.map((a: any) => (
                        <Link key={a.id} href={`/doubts/${a.doubt_id}`} className="block p-6 bg-white/2 rounded-3xl border border-white/5 hover:border-emerald-500/30 group transition-all">
                          <div className="text-gray-500 text-sm line-clamp-2 mb-3 italic">
                             "{a.content}"
                          </div>
                          <div className="flex items-center gap-3 text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                             {a.is_accepted && <span className="text-emerald-500 font-black">ACCEPTED</span>}
                             <span className="ml-auto">{new Date(a.created_at).toLocaleDateString()}</span>
                             <span>•</span>
                             <span>{a.votes} votes</span>
                          </div>
                        </Link>
                      ))}
                      {answers?.length === 0 && <div className="text-center py-20 text-gray-700 font-bold uppercase text-xs tracking-widest opacity-30">Null contributions</div>}
                    </motion.div>
                  )}

                  {activeTab === 'availability' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-black text-white">Weekly Availability</h3>
                         <div className="flex gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-indigo-500" /> Available</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-white/5" /> Busy</span>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-2">
                        {DAYS.map(day => (
                          <div key={day} className="space-y-2">
                            <div className="text-center text-[9px] font-black uppercase text-gray-600 tracking-tighter mb-4">{day.slice(0, 3)}</div>
                            <div className="space-y-1">
                              {Array.from({ length: 24 }).map((_, h) => {
                                const isAvail = profile.availability?.[day]?.includes(h);
                                return (
                                  <div 
                                    key={h} 
                                    className={`h-4 rounded-sm border transition-all ${
                                      isAvail ? 'bg-indigo-500/80 border-indigo-400/50' : 'bg-white/2 border-white/2 opacity-20'
                                    }`}
                                    title={`${h}:00 - ${day}`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-8 text-center">
                         <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 transition-all">
                            Book Strategic Session
                         </button>
                         <p className="mt-4 text-[10px] text-gray-500 font-bold">Standard rate: 250 Rep / Hour</p>
                      </div>
                    </motion.div>
                  )}
               </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
