'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakHeatmap } from '@/components/dashboard/StreakHeatmap';
import { ReviewQueueWidget } from '@/components/dashboard/ReviewQueueWidget';
import { MomentumPulse } from '@/components/dashboard/MomentumPulse';
import { MasteryTrajectoryChart } from '@/components/dashboard/MasteryTrajectoryChart';
import OrganizationView from '@/components/dashboard/OrganizationView';
import { SessionsWidget } from '@/components/dashboard/SessionsWidget';
import {
  Trophy,
  Zap,
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
  LayoutDashboard,
} from 'lucide-react';
import { authApi, doubtApi } from '@/lib/api';
import styles from './dashboard.module.css';
import { BadgeUnlockModal } from '@/components/dashboard/BadgeUnlockModal';

function TrendingDoubtsWidget() {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/doubts/trending')
      .then(res => res.json())
      .then(setTrending)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-40 bg-white/5 rounded-3xl p-8 border border-white/5 animate-pulse" />;
  if (trending.length === 0) return null;

  return (
    <div className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}>
        <TrendingUp className="w-5 h-5 text-indigo-400" />
        Explore Trending Doubts
      </h3>
      <div className="space-y-4">
        {trending.map((doubt, idx) => (
          <Link 
            key={doubt.id} 
            href={`/doubts/${doubt.id}`}
            className="block p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-indigo-500/30 group transition-all"
          >
            <div className="flex justify-between items-start gap-4">
               <div>
                  <h4 className="font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">{doubt.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                     <span className="text-indigo-400">{(doubt.author_name || 'Expert').split(' ')[0]}</span>
                     <span>•</span>
                     <span>{doubt.answer_count} Answers</span>
                     <span>•</span>
                     <Flame className="w-3 h-3 text-orange-500" />
                  </div>
               </div>
               <div className="flex flex-col items-center justify-center p-2 bg-white/5 rounded-xl border border-white/5 min-w-[50px]">
                  <div className="text-sm font-black text-white">{doubt.votes}</div>
                  <div className="text-[8px] text-gray-500 font-bold">VOTES</div>
               </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/doubts" className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors py-2 border border-dashed border-indigo-500/20 rounded-xl hover:bg-indigo-500/5">
         View All Transmissions <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default function DashboardPageClient() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ answers: 0, accepted: 0, doubts: 0 });
  const [badges, setBadges] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [momentum, setMomentum] = useState(0);
  const [masteryData, setMasteryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers' | 'organization'>('questions');
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<any>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const fetchData = async () => {
        const [
          profileRes, 
          doubtsRes, 
          answersRes, 
          activityRes,
          masteryRes
        ] = await Promise.all([
          authApi.getMyProfile(),
          doubtApi.getDoubts({ author_id: user.id }),
          authApi.getMyAnswers(),
          fetch('/api/analytics/activity').then(r => r.json()),
          fetch('/api/analytics/mastery-trajectory').then(r => r.json())
        ]);

        setProfile(profileRes.profile || null);
        setStats({
          answers: profileRes.stats?.answers ?? 0,
          accepted: profileRes.stats?.accepted ?? 0,
          doubts: profileRes.stats?.doubts ?? 0,
        });
        setBadges(profileRes.badges || []);
        setQuestions(Array.isArray(doubtsRes) ? doubtsRes : []);
        setAnswers(Array.isArray(answersRes) ? answersRes : []);
        setActivityData(activityRes.heatmap || []);
        setMomentum(activityRes.momentum?.value || 0);
        setMasteryData(masteryRes || []);
      };

      await fetchData();
      setIsFirstLoad(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    if (user) fetchDashboardData();
  }, [user, authLoading, router, fetchDashboardData]);

  if (authLoading || loading) {
    return (
      <div className={styles.dashboardContainer}>
        <header className={styles.headerCard}>
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="w-48 h-8 rounded-lg" />
              <Skeleton className="w-32 h-4 rounded-lg" />
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = (profile?.full_name || user.email || 'U').substring(0, 2).toUpperCase();

  return (
    <div className={styles.dashboardContainer}>
      <BadgeUnlockModal 
        badge={newlyUnlockedBadge} 
        onClose={() => setNewlyUnlockedBadge(null)} 
      />
      
      <header className={styles.headerCard}>
        <div className={styles.headerContent}>
          <div className={styles.avatarLarge}>{initials}</div>
          <div className={styles.headerInfo}>
            <h1 className={styles.name}>
              {profile?.full_name || user.email?.split('@')[0]}
            </h1>
            <p className={styles.bio}>
              {profile?.bio || 'SkillBridge member since 2026.'}
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className={styles.reputation}>
                <Trophy size={16} />
                <span>
                  {(profile?.reputation_points || 0).toLocaleString()} Reputation
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Flame size={16} />
                <span>{profile?.login_streak || 0} Day Streak</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/settings" className={styles.btnEdit}>
              <Settings size={18} />
              Settings
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tier 1: Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Doubts Asked', value: stats.doubts ?? 0, icon: MessageSquare, color: 'text-purple-400' },
          { label: 'Contributions', value: stats.answers ?? 0, icon: Award, color: 'text-blue-400' },
          { label: 'Accepted Answers', value: stats.accepted ?? 0, icon: Target, color: 'text-emerald-400' },
          { label: 'Global Rank', value: '#124', icon: TrendingUp, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#13132b] p-6 rounded-[32px] border border-white/5 flex flex-col items-center justify-center text-center">
            <div className={`p-2 rounded-lg bg-white/5 mb-3 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tier 2: Momentum & Review Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
         <div className="lg:col-span-1">
            <MomentumPulse value={momentum} />
         </div>
         <div className="lg:col-span-2">
            <ReviewQueueWidget />
         </div>
      </div>

      {/* Tier 3: Core Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
           <MasteryTrajectoryChart data={masteryData} />
        </div>
        <div className="lg:col-span-1">
           <StreakHeatmap activityData={activityData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <SessionsWidget />
           
           <div className={styles.sectionCard}>
            <div className="flex gap-4 border-b border-white/10 pb-4 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'questions' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                My Questions ({questions.length})
              </button>
              <button
                onClick={() => setActiveTab('answers')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'answers' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Contributions ({answers.length})
              </button>
              {profile?.role === 'organization' && (
                <button
                  onClick={() => setActiveTab('organization')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === 'organization' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Organization Hub
                </button>
              )}
            </div>

            {activeTab === 'questions' ? (
              questions.length > 0 ? (
                questions.map((item, idx) => (
                  <div key={idx} className={styles.activityItem}>
                    <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'answered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">No questions asked yet.</div>
              )
            ) : activeTab === 'answers' ? (
              answers.length > 0 ? (
                answers.map((item, idx) => (
                  <div key={idx} className={styles.activityItem}>
                    <h4 className="font-semibold text-white mb-2">{item.doubts?.title || 'Untitled Doubt'}</h4>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{item.content}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400">{item.votes ?? 0} votes</span>
                      {item.is_accepted && <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">ACCEPTED</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">No contributions yet.</div>
              )
            ) : (
              profile?.id && <OrganizationView orgId={profile.id} />
            )}
          </div>
        </div>

        <div className="space-y-8">
          <TrendingDoubtsWidget />
          
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <LayoutDashboard size={20} className="text-indigo-400" />
              Direct Access
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { href: '/doubts', label: 'Doubt Feed', icon: MessageSquare, color: 'bg-purple-500/10 text-purple-400' },
                { href: '/mentors', label: 'Book Expert', icon: User, color: 'bg-indigo-500/10 text-indigo-400' },
                { href: '/tests', label: 'AI Practice', icon: Target, color: 'bg-amber-500/10 text-amber-400' },
                { href: '/resources', label: 'Library', icon: BookOpen, color: 'bg-emerald-500/10 text-emerald-400' },
              ].map((action, i) => (
                <Link key={i} href={action.href} className={`${styles.navCard} ${action.color}`}>
                  <action.icon size={20} />
                  <span className="font-semibold">{action.label}</span>
                  <ArrowRight size={16} className="ml-auto" />
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <Trophy size={20} className="text-amber-400" />
              Achievement Hall
            </h3>
            {badges.length > 0 ? (
              badges.slice(0, 3).map((badge, idx) => (
                <div key={idx} className={styles.badgeItem}>
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mx-auto">
                    <Award size={24} />
                  </div>
                  <h4 className="font-semibold text-white mt-3 mb-1">{badge.name}</h4>
                  <p className="text-sm text-gray-400">Unlocked on {new Date(badge.earned_at).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">No badges yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
