'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakHeatmap } from '@/components/dashboard/StreakHeatmap';
import { Trophy, Zap, MessageSquare, BookOpen, User, Flame, ArrowRight, Target } from 'lucide-react';

function WeakAreasWidget() {
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/weak-areas')
      .then(res => res.json())
      .then(setWeakAreas)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton width="100%" height="160px" rounded />;
  
  if (weakAreas.length === 0) return (
    <div className="glass p-8 rounded-[32px] text-center border border-white/5">
      <div className="text-3xl mb-4">✨</div>
      <p className="text-gray-500 font-bold">Absolute Mastery. Keep exploring new subjects to grow further.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {weakAreas.map(area => (
        <motion.div 
          key={area.id} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-[32px] border-l-4 border-l-red-500 hover:bg-white/[0.02] transition-colors group"
        >
          <div className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-2 flex items-center gap-2">
            <Target size={12} /> Priority Area
          </div>
          <h4 className="text-xl font-black mb-1">{area.name}</h4>
          <p className="text-xs text-gray-500 mb-6 font-medium">Avg Score: {area.avg}% — Requires logical review.</p>
          <Link href="/tests" className="inline-flex items-center gap-2 text-red-400 font-black text-sm group-hover:gap-4 transition-all">
            Bridge Gap <ArrowRight size={16} />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

const XPProgressBar = ({ points }: { points: number }) => {
  const nextLevel = 1000;
  const progress = Math.min((points / nextLevel) * 100, 100);
  
  return (
    <div className="mb-12">
      <div className="flex justify-between items-end mb-4">
        <div>
           <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Reputation Progress</div>
           <div className="text-2xl font-black">{points} <span className="text-gray-600 text-sm">/ {nextLevel} PTS</span></div>
        </div>
        <div className="text-[10px] font-black text-gray-700">LVL 1</div>
      </div>
      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
        />
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const supabase = createSupabaseBrowser();

  const actions = [
    { href: '/doubts', label: 'Doubt Feed', icon: <MessageSquare />, color: 'bg-purple-500/10 text-purple-400' },
    { href: '/mentors', label: 'Book Expert', icon: <User />, color: 'bg-indigo-500/10 text-indigo-400' },
    { href: '/tests', label: 'AI Practice', icon: <Zap />, color: 'bg-amber-500/10 text-amber-400' },
    { href: '/resources', label: 'Library', icon: <BookOpen />, color: 'bg-emerald-500/10 text-emerald-400' },
  ];

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({data}) => setProfile(data));
      supabase.from('practice_attempts').select('created_at, score').eq('user_id', user.id).then(({data}) => setHistory(data || []));
    }
  }, [user, loading, router, supabase]);

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-24"><Skeleton height="400px" width="100%" rounded /></div>;
  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white pt-[72px]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-black font-heading mb-4 tracking-tighter">
              Welcome back, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
              </span> 👋
            </h1>
            <p className="text-gray-500 font-medium">Your academic laboratory is ready for the next breakthrough.</p>
          </div>

          <div className="flex gap-4">
             <div className="glass p-6 pr-12 rounded-[32px] border border-orange-500/20 bg-orange-500/[0.02]">
                <div className="flex items-center gap-3 mb-2">
                   <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-orange-500/80">Energy Streak</span>
                </div>
                <div className="text-3xl font-black">{profile?.login_streak || 0} Days</div>
             </div>
             <div className="glass p-6 pr-12 rounded-[32px] border border-indigo-500/20 bg-indigo-500/[0.02]">
                <div className="flex items-center gap-3 mb-2">
                   <Trophy className="w-5 h-5 text-indigo-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/80">Expertise Rank</span>
                </div>
                <div className="text-3xl font-black">{profile ? `#${Math.max(1, 420 - Math.floor((profile.reputation_points || 0) / 10))}` : '#--'}</div>
             </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Main Activity */}
          <div className="lg:col-span-2 space-y-8">
            <XPProgressBar points={profile?.reputation_points || 0} />
            <StreakHeatmap events={history} />
          </div>

          {/* Side Stats */}
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="glass p-8 rounded-[32px] text-center border border-white/5">
                   <div className="text-3xl font-black mb-1">{profile?.tests_taken || 0}</div>
                   <div className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Quizzes</div>
                </div>
                <div className="glass p-8 rounded-[32px] text-center border border-white/5">
                   <div className="text-3xl font-black mb-1">{profile?.doubts_answered || 0}</div>
                   <div className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Solved</div>
                </div>
             </div>
             <div className="bg-indigo-600 rounded-[32px] p-8 relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <h3 className="text-xl font-black mb-4 relative z-10">Pro Upgrade</h3>
                <p className="text-indigo-100 text-xs mb-8 opacity-80 leading-relaxed relative z-10">Get unlimited AI doubts, premium courses, and certified industry badges.</p>
                <Link href="/pricing" className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-sm relative z-10 inline-block">Upgrade Now</Link>
             </div>
          </div>
        </div>

        {/* Weak Areas Section */}
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                <Target size={18} />
             </div>
             <h2 className="text-2xl font-black font-heading">Concept Review Queue</h2>
          </div>
          <WeakAreasWidget />
        </section>

        {/* Navigation Grid */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8 border-b border-white/5 pb-4">Laboratory Terminals</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.map((action, i) => (
              <Link key={i} href={action.href} className="glass p-10 rounded-[40px] border border-white/5 group hover:border-indigo-500/30 transition-all text-center flex flex-col items-center">
                 <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                 </div>
                 <span className="font-black text-sm">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-24 pt-12 border-t border-white/5 flex justify-center">
           <button 
             onClick={signOut}
             className="px-8 py-3 rounded-full border border-white/10 text-gray-500 font-bold hover:text-white hover:bg-white/5 transition-all text-sm"
           >
             Sign Out Session
           </button>
        </div>

      </div>
    </main>
  );
}
