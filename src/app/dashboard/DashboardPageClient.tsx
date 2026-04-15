'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Trophy,
  MessageSquare,
  BookOpen,
  User,
  Flame,
  ArrowRight,
  Target,
  Settings,
  LogOut,
  TrendingUp,
  Award,
  History,
  LayoutDashboard,
} from 'lucide-react';
import styles from './dashboard.module.css';

/**
 * DashboardPageClient
 * Re-engineered for Lean MVP. 
 * Single-fetch architecture for performance & stability.
 */
export default function DashboardPageClient() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'stats'>('activity');

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
        throw new Error(json.error || 'Failed to load dashboard');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard. Please refresh or try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    if (user) fetchDashboardStats();
  }, [user, authLoading, router, fetchDashboardStats]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-400/10 text-red-400 flex items-center justify-center mb-6">
           <LogOut size={40} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">{error}</h2>
        <button onClick={() => fetchDashboardStats()} className="px-8 py-3 bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">Retry Connection</button>
      </div>
    );
  }

  if (authLoading || loading) {
// ... existing skeleton ...
    return (
      <div className={styles.dashboardContainer}>
        <Skeleton className="w-full h-48 rounded-[32px] mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-[32px]" />
          <Skeleton className="h-40 rounded-[32px]" />
          <Skeleton className="h-40 rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  const { profile, stats, recent_activity } = data;
  const initials = (profile?.full_name || user.email || 'U').substring(0, 2).toUpperCase();

  return (
    <div className={styles.dashboardContainer}>
      {/* 🚀 Header: Identity & Status */}
      <header className={styles.headerCard}>
        <div className={styles.headerContent}>
          <div className={styles.avatarLarge}>{initials}</div>
          <div className={styles.headerInfo}>
            <div className="flex items-center gap-3">
               <h1 className={styles.name}>{profile?.full_name || user.email?.split('@')[0]}</h1>
               <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                  {profile?.role || 'Student'}
               </span>
            </div>
            <p className={styles.bio}>{profile?.bio || 'Passionate learner exploring the SkillBridge ecosystem.'}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className={styles.reputation}>
                <Trophy size={16} />
                <span>{(stats.reputation || 0).toLocaleString()} Reputation</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold text-xs">
                <Flame size={16} />
                <span>{profile?.login_streak || 0} Day Streak</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/settings" className={styles.btnEdit}><Settings size={18} /> Settings</Link>
            <button onClick={() => signOut()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* 📊 Tier 1: KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Doubts', value: stats.doubts, icon: MessageSquare, color: 'text-purple-400' },
          { label: 'Total Answers', value: stats.answers, icon: Award, color: 'text-blue-400' },
          { label: 'Reputation', value: stats.reputation, icon: Trophy, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#13132b] p-8 rounded-[32px] border border-white/5 flex flex-col items-center justify-center text-center hover:border-white/10 transition-all">
            <div className={`p-3 rounded-2xl bg-white/5 mb-4 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div className="text-3xl font-black text-white mb-1">{stat.value.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ⚡ Tier 2: Activity & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Activity Feed */}
        <div className="lg:col-span-2">
           <div className={styles.sectionCard}>
              <div className="flex items-center justify-between mb-6">
                 <h3 className={styles.sectionTitle}>
                    <History size={20} className="text-indigo-400" /> Recent Activity
                 </h3>
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Last 5 Events</span>
              </div>

              <div className="space-y-4">
                 {recent_activity.length > 0 ? (
                    recent_activity.map((act: any, idx: number) => (
                       <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 group hover:border-indigo-500/30 transition-all">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                             {act.type === 'doubt' && <MessageSquare size={18} className="text-purple-400" />}
                             {act.type === 'answer' && <Award size={18} className="text-blue-400" />}
                             {act.type === 'accepted' && <Trophy size={18} className="text-amber-400" />}
                             {act.type === 'test' && <Target size={18} className="text-emerald-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{act.title}</h4>
                             {act.subtitle && <p className="text-[10px] text-gray-400 truncate mt-0.5">{act.subtitle}</p>}
                             <p className="text-[9px] text-gray-600 mt-1 font-medium uppercase tracking-tighter">{new Date(act.date).toLocaleDateString()} • {act.type.toUpperCase()}</p>
                          </div>
                          <ArrowRight size={14} className="text-gray-700 group-hover:text-indigo-400 transition-all" />
                       </div>
                    ))
                 ) : (
                    <div className="text-center py-12">
                       <p className="text-gray-500 text-sm italic">No recent activity found. Start exploring!</p>
                       <Link href="/doubts" className="mt-4 inline-block text-xs font-bold text-indigo-400 underline uppercase tracking-widest">Ask your first doubt</Link>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Right: Direct Navigation */}
        <div className="lg:col-span-1 space-y-8">
           <div className={styles.sectionCard}>
              <h3 className={styles.sectionTitle}>
                 <LayoutDashboard size={20} className="text-emerald-400" /> Direct Access
              </h3>
              <div className="grid grid-cols-1 gap-3">
                 {[
                   { href: '/doubts', label: 'Doubt Feed', icon: MessageSquare, color: 'bg-purple-500/10 text-purple-400' },
                   { href: '/mentors', label: 'Book Expert', icon: User, color: 'bg-indigo-500/10 text-indigo-400' },
                   { href: '/tests', label: 'AI Practice', icon: Target, color: 'bg-amber-500/10 text-amber-400' },
                   { href: '/resources', label: 'Library', icon: BookOpen, color: 'bg-emerald-500/10 text-emerald-400' },
                 ].map((action, i) => (
                   <Link key={i} href={action.href} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group">
                     <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon size={18} />
                     </div>
                     <span className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform">{action.label}</span>
                     <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                   </Link>
                 ))}
              </div>
           </div>

           {/* Achievements Lite */}
           <div className={styles.sectionCard}>
              <h3 className={styles.sectionTitle}>
                 <Trophy size={20} className="text-amber-400" /> Milestone Hub
              </h3>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-white/5 text-center">
                 <p className="text-xs text-gray-400 font-medium mb-4">Complete more practice tests to unlock your first badge!</p>
                 <Link href="/tests" className="inline-block px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
                    Get Started
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
