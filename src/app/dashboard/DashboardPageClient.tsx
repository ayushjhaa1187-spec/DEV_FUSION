'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakHeatmap } from '@/components/dashboard/StreakHeatmap';
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
  Clock,
  Star,
  Check,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  Award,
  BrainCircuit,
  Rocket,
} from 'lucide-react';
import { authApi, doubtApi } from '@/lib/api';
import styles from './dashboard.module.css';
import { BadgeUnlockModal } from '@/components/dashboard/BadgeUnlockModal';

function PriorityLearningWidget() {
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/weak-areas')
      .then((res) => res.ok ? res.json() : [])
      .then(setWeakAreas)
      .catch((err) => {
        console.error('Weak areas fetch failed:', err);
        setWeakAreas([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-40 bg-white/5 rounded-3xl p-8 border border-white/5 animate-pulse" />
  );

  return (
    <div className={styles.sectionCard}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={styles.sectionTitle + " mb-0"}>
          <BrainCircuit className="w-5 h-5 text-cyan-400" />
          Concept Review Queue
        </h3>
        {weakAreas.length > 0 && (
          <Link href="/tests" className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest bg-cyan-400/10 px-2 py-1 rounded">
             Rapid Practise
          </Link>
        )}
      </div>
      {!Array.isArray(weakAreas) || weakAreas.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">✨</div>
          <div className="font-bold text-white mb-1">Absolute Mastery</div>
          <p className="text-xs">You've cleared your high-priority review queue!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {weakAreas.map((area, idx) => (
            <div key={idx} className={styles.reviewItem}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">
                    Priority Topic
                  </div>
                  <h4 className="font-bold text-white mb-1">{area.name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 transition-all duration-1000" 
                        style={{ width: `${area.avg}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{area.avg}% Mastery</span>
                  </div>
                </div>
                <Link 
                  href={`/tests?subject=${area.id}`}
                  className="p-2 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-400/50 text-cyan-400 transition-all"
                >
                  <Rocket size={16} />
                </Link>
              </div>
            </div>
          ))}
          <Link href="/tests" className="block text-center text-[10px] font-bold text-gray-500 hover:text-white transition-colors pt-2 uppercase tracking-widest">
            View All Performance Logs
          </Link>
        </div>
      )}
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(user?.user_metadata?.role === 'organization' ? 'organization' : 'questions');
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<any>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [activity, setActivity] = useState({ doubts: 0, tests: 0, answers: 0 });

  const supabase = createSupabaseBrowser();

  const navActions = [
    { href: '/doubts', label: 'Doubt Feed', icon: MessageSquare, color: 'bg-purple-500/10 text-purple-400' },
    { href: '/mentors', label: 'Book Expert', icon: User, color: 'bg-indigo-500/10 text-indigo-400' },
    { href: '/tests', label: 'AI Practice', icon: Target, color: 'bg-amber-500/10 text-amber-400' },
    { href: '/resources', label: 'Library', icon: BookOpen, color: 'bg-emerald-500/10 text-emerald-400' },
  ];

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [profileRes, questionsRes, answersRes, activityRes] = await Promise.allSettled([
        authApi.getMyProfile(),
        doubtApi.getDoubts({ author_id: user.id }),
        authApi.getMyAnswers(),
        fetch('/api/analytics/activity').then(r => r.json()),
      ]);
      
      if (profileRes.status === 'fulfilled') {
        const profileData = profileRes.value;
        setProfile(profileData.profile || null);
        setStats({
          answers: profileData.stats?.answers ?? 0,
          accepted: profileData.stats?.accepted ?? 0,
          doubts: profileData.stats?.doubts ?? 0,
        });

        const newBadges = profileData.badges || [];
        
        // Show modal only if not first load and badges increased
        if (!isFirstLoad && newBadges.length > badges.length) {
          const addedBadge = newBadges.find((nb: any) => 
            !badges.some((ob: any) => ob.badge_id === nb.badge_id)
          );
          if (addedBadge) setNewlyUnlockedBadge(addedBadge);
        }

        setBadges(newBadges);
        setIsFirstLoad(false);
      }
      
      if (questionsRes.status === 'fulfilled') {
        setQuestions(Array.isArray(questionsRes.value) ? questionsRes.value : []);
      }
      
      if (answersRes.status === 'fulfilled') {
        setAnswers(Array.isArray(answersRes.value) ? answersRes.value : []);
      }
      if (activityRes.status === 'fulfilled') {
        setActivity(activityRes.value);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  if (authLoading || loading) {
    return (
      <div className={styles.dashboardContainer}>
        <header className={styles.headerCard}>
          <div className="flex items-center gap-4">
            <div className={styles.avatarLarge}>Loading</div>
            <div>
              <div className={styles.name}>Loading...</div>
              <div className={styles.bio}>Please wait</div>
            </div>
          </div>
        </header>
        <div className={styles.statsRow}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-full h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <Skeleton className="w-full h-[200px] rounded-xl" />
            <Skeleton className="w-full h-[300px] rounded-xl" />
          </div>
          <div className="flex flex-col gap-8">
            <Skeleton className="w-full h-[200px] rounded-xl" />
            <Skeleton className="w-full h-[200px] rounded-xl" />
            <Skeleton className="w-full h-[200px] rounded-xl" />
          </div>
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
              {profile?.bio || 'SkillBridge member since 2024.'}
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className={styles.reputation}>
                <Trophy />
                <span>
                  {(profile?.reputation_points || 0).toLocaleString()} Reputation
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>{profile?.login_streak || 0} Day Streak</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/settings" className={styles.btnEdit}>
              <Settings />
              Settings
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className={styles.statsRow}>
        {[
          { label: 'Doubts Asked', value: stats.doubts ?? 0, icon: MessageSquare, color: 'purple' },
          { label: 'Answers Given', value: stats.answers ?? 0, icon: Award, color: 'blue' },
          { label: 'Learning Momentum', value: `+${activity.doubts + activity.tests + activity.answers}`, icon: Zap, color: 'emerald' },
          { label: 'Global Rank', value: '#124', icon: TrendingUp, color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`p-2 rounded-lg bg-white/5 w-fit mx-auto mb-3 text-gray-400`}>
              <stat.icon size={20} />
            </div>
            <div className={`${styles.statValue} ${styles[stat.color]}`}>
              {stat.value}
            </div>
            <div className={styles.statLabel}>{stat.label}</div>
            {stat.label === 'Learning Momentum' && (
              <div className="text-[10px] text-emerald-400/60 font-bold mt-1">LAST 7 DAYS</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <SessionsWidget />
           <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <Flame className="w-5 h-5 text-orange-400" />
              Activity Pulse
            </h3>
            <StreakHeatmap events={questions} />
          </div>

          <div className={styles.sectionCard}>
            <div className="flex gap-4 border-b border-white/10 pb-4 mb-6 overflow-x-auto">
              {profile?.role === 'organization' && (
                <button
                  onClick={() => setActiveTab('organization')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === 'organization'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Organization Hub
                </button>
              )}
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'questions'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                My Questions ({questions.length})
              </button>
              <button
                onClick={() => setActiveTab('answers')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'answers'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Contributions ({answers.length})
              </button>
            </div>

            {activeTab === 'organization' && profile?.id && (
              <OrganizationView orgId={profile.id} />
            )}

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
                      <span className="text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-gray-400">
                        {item.answer_count || 0} answers
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  No questions asked yet.
                </div>
              )
            ) : (
              answers.length > 0 ? (
                answers.map((item, idx) => (
                  <div key={idx} className={styles.activityItem}>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                      Response to:
                    </div>
                    <h4 className="font-semibold text-white mb-2">
                      {item.doubts?.title || 'Untitled Doubt'}
                    </h4>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400">
                        {item.votes ?? 0} votes
                      </span>
                      {item.is_accepted && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          ACCEPTED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  No contributions yet.
                </div>
              )
            )}
          </div>
        </div>

        <div className="space-y-8">
          <TrendingDoubtsWidget />
          <PriorityLearningWidget />

          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <LayoutDashboard className="w-5 h-5 text-indigo-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {navActions.map((action, i) => {
                const IconComponent = action.icon;
                return (
                  <Link
                    key={i}
                    href={action.href}
                    className={`${styles.navCard} ${action.color}`}
                  >
                    <IconComponent className="w-6 h-6" />
                    <span className="font-semibold">{action.label}</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <Trophy className="w-5 h-5 text-amber-400" />
              Top Badges
            </h3>
            {badges.length > 0 ? (
              badges.slice(0, 3).map((badge, idx) => (
                <div key={idx} className={styles.badgeItem}>
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mx-auto">
                    <Award size={24} />
                  </div>
                  <h4 className="font-semibold text-white mt-3 mb-1">{badge.name}</h4>
                  <p className="text-sm text-gray-400">
                    Unlocked on {new Date(badge.earned_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                No badges yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
