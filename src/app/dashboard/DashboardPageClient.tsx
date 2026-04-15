'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  Trophy, MessageSquare, Flame, ArrowRight, Target, 
  Settings, LogOut, Award, History, LayoutDashboard,
  Brain, Sparkles
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import styles from './dashboard.module.css';

/**
 * DashboardPageClient
 * Re-engineered for Phase 4 Motion & UI Polish.
 */
export default function DashboardPageClient() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/stats');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Identity uplink failure.');
      }
    } catch (err: any) {
      setError(err.message || 'The dashboard failed to synchronize with the neural network.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    if (user) fetchDashboardStats();
  }, [user, authLoading, router, fetchDashboardStats]);

  // Framer Motion Variants
  const containerVars = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    }
  };

  if (error) {
    return (
      <div className="py-20 max-w-7xl mx-auto px-6">
        <ErrorState message={error} onRetry={fetchDashboardStats} />
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="sb-skeleton h-60 w-full mb-8 rounded-[40px]" />
        <div className="sb-grid sb-grid-3 mb-10">
          <div className="sb-skeleton h-44 rounded-[40px]" />
          <div className="sb-skeleton h-44 rounded-[40px]" />
          <div className="sb-skeleton h-44 rounded-[40px]" />
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  const { profile, stats, recent_activity } = data;
  const initials = (profile?.full_name || user.email || 'U').substring(0, 2).toUpperCase();

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="max-w-7xl mx-auto px-6 py-8"
    >
      {/* 🚀 Header: Identity & Status */}
      <motion.header variants={itemVars} className="sb-card !p-0 overflow-hidden mb-12 shadow-premium">
        <div className="bg-gradient-to-r from-violet-600/10 to-emerald-500/10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-32 h-32 rounded-[42px] bg-violet-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-violet-600/40 relative"
          >
            {initials}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-black rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles size={18} className="text-white" />
            </div>
          </motion.div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
               <h1 className="text-4xl font-black tracking-tight font-heading m-0">{profile?.full_name || user.email?.split('@')[0]}</h1>
               <span className="px-4 py-1.5 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-500/20">
                  {profile?.role || 'Knowledge Seeker'}
               </span>
            </div>
            <p className="text-gray-400 font-medium max-w-xl mb-6 text-lg leading-relaxed">
              {profile?.bio || 'Harnessing the SkillBridge ecosystem to accelerate academic and professional growth.'}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
                <Trophy size={18} className="text-amber-400" />
                <span className="text-sm font-bold tracking-tight">{(stats.reputation || 0).toLocaleString()} <span className="text-gray-500 font-medium lowercase">rep</span></span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
                <Flame size={18} className="text-orange-500" />
                <span className="text-sm font-bold tracking-tight">{profile?.login_streak || 0} <span className="text-gray-500 font-medium lowercase">day streak</span></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px]">
            <Link href="/settings" className="sb-btn sb-btn-secondary w-full py-4 text-sm">
              <Settings size={18} /> Identity Config
            </Link>
          </div>
        </div>
      </motion.header>

      {/* 📊 Tier 1: KPI Stats */}
      <div className="sb-grid sb-grid-3 mb-12">
        {[
          { label: 'Total Doubts', value: stats.doubts, icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Verified Answers', value: stats.answers, icon: Award, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Network Points', value: stats.reputation, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVars}
            whileHover={{ y: -6 }}
            className="sb-card !p-10 flex flex-col items-center text-center group"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-inner border border-white/5 transition-transform group-hover:scale-110`}>
              <stat.icon size={28} />
            </div>
            <div className="text-4xl font-black tracking-tight m-0">{stat.value.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ⚡ Tier 2: Activity & Shortcuts */}
      <div className="sb-grid lg:grid-cols-3 gap-10">
        {/* Left: Recent Activity Feed */}
        <motion.div variants={itemVars} className="lg:col-span-2">
           <div className="sb-card h-full">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-black tracking-tight m-0 flex items-center gap-3">
                    <History size={20} className="text-violet-400" /> Neural Activity
                 </h3>
                 <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Real-time Feed</span>
              </div>

              <div className="space-y-4">
                 {recent_activity.length > 0 ? (
                    recent_activity.map((act: any, idx: number) => (
                       <motion.div 
                        key={idx}
                        whileHover={{ x: 6 }}
                        className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-5 group hover:border-violet-500/30 transition-all cursor-pointer"
                       >
                          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-inner">
                             {act.type === 'doubt' && <MessageSquare size={20} className="text-purple-400" />}
                             {act.type === 'answer' && <Award size={20} className="text-blue-400" />}
                             {act.type === 'accepted' && <Trophy size={20} className="text-amber-400" />}
                             {act.type === 'test' && <Target size={20} className="text-emerald-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-bold text-white truncate group-hover:text-violet-400 transition-colors m-0">{act.title}</h4>
                             {act.subtitle && <p className="text-[11px] text-gray-400 truncate mt-1 font-medium">{act.subtitle}</p>}
                             <p className="text-[9px] text-gray-600 mt-2 font-black uppercase tracking-widest">{new Date(act.date).toLocaleDateString()} • {act.type}</p>
                          </div>
                          <ArrowRight size={16} className="text-gray-800 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                       </motion.div>
                    ))
                 ) : (
                    <EmptyState 
                      icon={Sparkles}
                      title="No Neural Activity"
                      description="Initialize your learning path. Ask a doubt or explore the community to populate your feed."
                      actionText="Ask First Doubt"
                      actionHref="/doubts/ask"
                    />
                 )}
              </div>
           </div>
        </motion.div>

        {/* Right: Direct Navigation */}
        <motion.div variants={itemVars} className="lg:col-span-1 flex flex-col gap-10">
           <div className="sb-card">
              <h3 className="text-lg font-black tracking-tight mb-8 m-0 flex items-center gap-3">
                 <LayoutDashboard size={20} className="text-emerald-400" /> Accelerated Access
              </h3>
              <div className="flex flex-col gap-3">
                 {[
                   { href: '/doubts', label: 'Knowledge Hub', icon: MessageSquare, color: 'bg-purple-500/10 text-purple-400' },
                   { href: '/mentors', label: 'Mentor Sync', icon: User, color: 'bg-violet-500/10 text-violet-400' },
                   { href: '/tests', label: 'AI Simulations', icon: Target, color: 'bg-amber-500/10 text-amber-400' },
                 ].map((action, i) => (
                   <motion.div key={i} whileHover={{ x: 4 }}>
                    <Link href={action.href} className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/20 hover:bg-violet-500/5 transition-all group">
                      <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center shadow-inner`}>
                          <action.icon size={20} />
                      </div>
                      <span className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">{action.label}</span>
                      <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>
                   </motion.div>
                 ))}
              </div>
           </div>

           {/* Achievements Lite */}
           <motion.div variants={itemVars} className="sb-card !p-0 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-8 pb-10 flex flex-col items-center text-center relative z-10">
                <div className="w-16 h-16 rounded-[24px] bg-violet-600/20 text-violet-400 flex items-center justify-center mb-6 shadow-premium border border-violet-500/20">
                  <Brain size={32} />
                </div>
                <h4 className="text-xl font-black mb-2 tracking-tight">Milestone Sync</h4>
                <p className="text-xs text-gray-500 font-bold max-w-[200px] mb-8 leading-relaxed uppercase tracking-widest">Complete more practice modules to unlock elite status</p>
                <Link href="/tests" className="sb-btn sb-btn-primary w-full shadow-premium">
                  Analyze Progress
                </Link>
              </div>
           </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
