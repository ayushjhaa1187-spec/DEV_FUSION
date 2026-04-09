'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakHeatmap } from '@/components/dashboard/StreakHeatmap';
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

function PriorityLearningWidget() {
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/weak-areas')
      .then((res) => res.json())
      .then(setWeakAreas)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}>
        <BrainCircuit className="w-5 h-5 text-cyan-400" />
        Concept Review Queue
      </h3>
      {weakAreas.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">✨</div>
          Absolute Mastery. You've cleared your review queue!
        </div>
      ) : (
        weakAreas.map((area, idx) => (
          <div key={idx} className={styles.reviewItem}>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
              Priority Topic
            </div>
            <h4 className="font-semibold text-white mb-1">{area.name}</h4>
            <p className="text-sm text-gray-400">
              Avg Score: {area.avg}% • Accuracy Gap Detected
            </p>
          </div>
        ))
      )}
    </div>
  );
}

const getBadgeIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('answer')) return <Award className="w-8 h-8 text-amber-400" />;
  if (n.includes('mentor')) return <Rocket className="w-8 h-8 text-purple-400" />;
  if (n.includes('star')) return <Star className="w-8 h-8 text-yellow-400" />;
  if (n.includes('quick')) return <Zap className="w-8 h-8 text-blue-400" />;
  return <Trophy className="w-8 h-8 text-gray-400" />;
};

export default function DashboardPageClient() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ answers: 0, accepted: 0, doubts: 0 });
  const [badges, setBadges] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');

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
      const [profileData, questionsData, answersData] = await Promise.all([
        authApi.getMyProfile(),
        doubtApi.getDoubts({ author_id: user.id }),
        authApi.getMyAnswers(),
      ]);
      setProfile(profileData.profile || null);
      setStats({
        answers: profileData.stats?.answers ?? 0,
        accepted: profileData.stats?.accepted ?? 0,
        doubts: profileData.stats?.doubts ?? 0,
      });
      setBadges(profileData.badges || []);
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
      setAnswers(Array.isArray(answersData) ? answersData : []);
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
            <Skeleton key={i} width="100%" height="120px" rounded />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <Skeleton width="100%" height="200px" rounded />
            <Skeleton width="100%" height="300px" rounded />
          </div>
          <div className="flex flex-col gap-8">
            <Skeleton width="100%" height="200px" rounded />
            <Skeleton width="100%" height="200px" rounded />
            <Skeleton width="100%" height="200px" rounded />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = (profile?.full_name || user.email || 'U').substring(0, 2).toUpperCase();

  return (
    <div className={styles.dashboardContainer}>
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
            <Link href="/profile" className={styles.btnEdit}>
              <Settings />
              Edit Profile
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
          { label: 'Accepted', value: stats.accepted ?? 0, icon: Check, color: 'green' },
          { label: 'Global Rank', value: '#124', icon: TrendingUp, color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`p-2 rounded-lg bg-white/5 w-fit mx-auto mb-3 text-gray-400`}>
              <stat.icon />
            </div>
            <div className={`${styles.statValue}${styles[stat.color]}`}>
              {stat.value}
            </div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>
          <Flame className="w-5 h-5 text-orange-400" />
          Activity Pulse
        </h3>
        <StreakHeatmap events={questions} />
      </div>

      <div className={styles.sectionCard}>
        <div className="flex gap-4 border-b border-white/10 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'questions'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('answers')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'answers'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Contributions ({answers.length})
          </button>
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

      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>
          <LayoutDashboard className="w-5 h-5 text-indigo-400" />
          Terminals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <ArrowRight className="w-4 h-4" />
                <span className="text-xs opacity-70">Access Module</span>
              </Link>
            );
          })}
        </div>
      </div>

      <PriorityLearningWidget />

      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>
          <Trophy className="w-5 h-5 text-amber-400" />
          Top Badges
        </h3>
        {badges.length > 0 ? (
          badges.slice(0, 3).map((badge, idx) => (
            <div key={idx} className={styles.badgeItem}>
              {getBadgeIcon(badge.name)}
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
  );
}
