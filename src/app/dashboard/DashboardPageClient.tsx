'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  Trophy, MessageSquare, Flame, ArrowRight, Target, 
  Settings, Award, History, LayoutDashboard,
  Brain, Sparkles, User
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

/**
 * DashboardPageClient
 * Optimized for performance and high-fidelity motion.
 */
export default function DashboardPageClient() {
  const { user, loading: authLoading } = useAuth();
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

  // Framer Motion Variants (Memoized to prevent recreation)
  const containerVars = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  }), []);

  const itemVars = useMemo(() => ({
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    }
  }), []);

  const kpiStats = useMemo(() => {
    if (!data?.stats) return [];
    return [
      { label: 'Total Doubts', value: data.stats.doubts, icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
      { label: 'Verified Answers', value: data.stats.answers, icon: Award, color: 'text-blue-400', bg: 'bg-blue-500/10' },
      { label: 'Network Points', value: data.stats.reputation, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ];
  }, [data?.stats]);

  const quickActions = useMemo(() => [
    { href: '/doubts', label: 'Knowledge Hub', icon: MessageSquare, color: 'bg-purple-500/10 text-purple-400' },
    { href: '/mentors', label: 'Mentor Sync', icon: User, color: 'bg-violet-500/10 text-violet-400' },
    { href: '/tests', label: 'AI Simulations', icon: Target, color: 'bg-amber-500/10 text-amber-400' },
  ], []);

  if (error) {
    return (
      <div className="py-20 max-w-7xl mx-auto px-6">
        <ErrorState message={error} onRetry={fetchDashboardStats} />
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="sb-skeleton-container space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-gray-100 dark:bg-white/5 rounded-[40px] animate-pulse" />
          <div className="h-44 bg-gray-100 dark:bg-white/5 rounded-[40px] animate-pulse" />
          <div className="h-44 bg-gray-100 dark:bg-white/5 rounded-[40px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  const { profile, recent_activity } = data;
  const initials = (profile?.full_name || user.email || 'U').substring(0, 2).toUpperCase();

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVars}
      className="space-y-12"
    >
      {/* 📊 KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {kpiStats.map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVars}
            whileHover={{ y: -6 }}
            className="bg-white dark:bg-[#0a0a1a] p-10 rounded-[40px] border border-gray-100 dark:border-white/5 flex flex-col items-center text-center group shadow-sm hover:shadow-xl transition-all"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-inner border border-white/5 transition-transform group-hover:scale-110`}>
              <stat.icon size={28} />
            </div>
            <div className="text-4xl font-black tracking-tight m-0 text-gray-900 dark:text-white">{stat.value.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ⚡ Activity & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Recent Activity Feed */}
        <motion.div variants={itemVars} className="lg:col-span-2">
           <div className="bg-white dark:bg-[#0a0a1a] p-8 rounded-[40px] border border-gray-100 dark:border-white/5 h-full shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-black tracking-tight m-0 flex items-center gap-3 text-gray-900 dark:text-white">
                    <History size={20} className="text-violet-400" /> Neural Activity
                 </h3>
                 <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Real-time Feed</span>
              </div>

              <div className="space-y-4">
                 {recent_activity.length > 0 ? (
                    recent_activity.map((act: any, idx: number) => (
                       <motion.div 
                        key={idx}
                        whileHover={{ x: 6 }}
                        className="p-5 bg-gray-50 dark:bg-white/5 border border-transparent hover:border-violet-500/30 rounded-3xl flex items-center gap-5 group transition-all"
                       >
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black border border-gray-100 dark:border-white/5 flex items-center justify-center shrink-0 shadow-sm">
                             {act.type === 'doubt' && <MessageSquare size={20} className="text-purple-400" />}
                             {act.type === 'answer' && <Award size={20} className="text-blue-400" />}
                             {act.type === 'accepted' && <Trophy size={20} className="text-amber-400" />}
                             {act.type === 'test' && <Target size={20} className="text-emerald-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-violet-500 transition-colors m-0">{act.title}</h4>
                             {act.subtitle && <p className="text-[11px] text-gray-500 truncate mt-1 font-medium">{act.subtitle}</p>}
                             <p className="text-[9px] text-gray-400 mt-2 font-black uppercase tracking-widest">{new Date(act.date).toLocaleDateString()} • {act.type}</p>
                          </div>
                          <ArrowRight size={16} className="text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
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
           <div className="bg-white dark:bg-[#0a0a1a] p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-sm">
              <h3 className="text-lg font-black tracking-tight mb-8 m-0 flex items-center gap-3 text-gray-900 dark:text-white">
                 <LayoutDashboard size={20} className="text-emerald-400" /> Quick Access
              </h3>
              <div className="flex flex-col gap-3">
                 {quickActions.map((action, i) => (
                   <motion.div key={i} whileHover={{ x: 4 }}>
                    <Link href={action.href} className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-violet-500/20 hover:bg-violet-500/5 transition-all group">
                      <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center shadow-sm`}>
                          <action.icon size={20} />
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-violet-500 transition-colors">{action.label}</span>
                      <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>
                   </motion.div>
                 ))}
              </div>
           </div>

           {/* Achievements Lite */}
           <motion.div variants={itemVars} className="bg-white dark:bg-[#0a0a1a] p-8 rounded-[40px] border border-gray-100 dark:border-white/5 relative group overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-[24px] bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-6 shadow-sm border border-violet-500/10">
                  <Brain size={32} />
                </div>
                <h4 className="text-xl font-black mb-2 tracking-tight text-gray-900 dark:text-white">Milestone Sync</h4>
                <p className="text-[10px] text-gray-400 font-bold max-w-[200px] mb-8 uppercase tracking-widest">Complete more modules to unlock elite status</p>
                <Link href="/tests" className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-transform text-center">
                   Analyze Progress
                </Link>
              </div>
           </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
