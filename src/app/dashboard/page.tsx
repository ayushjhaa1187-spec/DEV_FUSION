'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakHeatmap } from '@/components/dashboard/StreakHeatmap';
import { 
  Trophy, Zap, MessageSquare, BookOpen, User, Flame, 
  ArrowRight, Target, Clock, Star, Check, 
  LayoutDashboard, Settings, LogOut, ChevronRight,
  TrendingUp, Award, BrainCircuit, Rocket
} from 'lucide-react';
import { authApi, doubtApi } from '@/lib/api';
import styles from './dashboard.module.css';

// Enhanced Priority Learning Widget
function PriorityLearningWidget() {
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/weak-areas')
      .then(res => res.json())
      .then(setWeakAreas)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton width="100%" height="200px" rounded />;

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionTitle}>
        <BrainCircuit className="w-5 h-5 text-purple-400" />
        <h2>Concept Review Queue</h2>
      </div>
      
      {weakAreas.length === 0 ? (
        <div className="glass p-8 rounded-[24px] text-center border border-white/5">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-gray-400 font-medium">Absolute Mastery. You've cleared your review queue!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weakAreas.map(area => (
            <motion.div 
              key={area.id}
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group"
            >
              <div>
                <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-1 block">Priority Topic</span>
                <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">{area.name}</h4>
                <p className="text-xs text-gray-500 mt-1">Avg Score: {area.avg}% • Accuracy Gap Detected</p>
              </div>
              <Link href={`/tests?topic=${area.id}`} className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

const getBadgeIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('answer')) return <Award className="w-6 h-6" />;
  if (n.includes('mentor')) return <User className="w-6 h-6" />;
  if (n.includes('star')) return <Star className="w-6 h-6" />;
  if (n.includes('quick')) return <Zap className="w-6 h-6" />;
  return <Trophy className="w-6 h-6" />;
};

export default function DashboardPage() {
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
    { href: '/doubts', label: 'Doubt Feed', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-purple-500/10 text-purple-400' },
    { href: '/mentors', label: 'Book Expert', icon: <User className="w-5 h-5" />, color: 'bg-indigo-500/10 text-indigo-400' },
    { href: '/tests', label: 'AI Practice', icon: <Target className="w-5 h-5" />, color: 'bg-amber-500/10 text-amber-400' },
    { href: '/resources', label: 'Library', icon: <BookOpen className="w-5 h-5" />, color: 'bg-emerald-500/10 text-emerald-400' },
  ];

  const fetchData = async () => {
    if (!user) return;
    try {
      const [profileData, questionsData, answersData] = await Promise.all([
        authApi.getMyProfile(),
        doubtApi.getDoubts({ author_id: user.id }),
        authApi.getMyAnswers(),
      ]);
      setProfile(profileData.profile);
      setStats(profileData.stats);
      setBadges(profileData.badges || []);
      setQuestions(questionsData);
      setAnswers(answersData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    if (user) fetchData();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Skeleton width="100%" height="200px" rounded />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} width="100%" height="120px" rounded />)}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = (profile?.full_name || user.email || 'U').substring(0, 2).toUpperCase();

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Enhanced Glass Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerContent}>
          <div className={styles.avatarLarge}>{initials}</div>
          <div className={styles.headerInfo}>
            <h1 className={styles.name}>{profile?.full_name || user.email?.split('@')[0]}</h1>
            <p className={styles.bio}>{profile?.bio || 'SkillBridge member since 2024.'}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className={styles.reputation}>
                <Trophy />
                <span>{(profile?.reputation_points || 0).toLocaleString()} Reputation</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-semibold">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>{profile?.login_streak || 0} Day Streak</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/profile" className={styles.btnEdit}>
              <Settings /> Edit Profile
            </Link>
            <button onClick={() => signOut()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* 2. Key Metrics Row */}
      <div className={styles.statsRow}>
        {[
          { label: 'Doubts Asked', value: stats.doubts, icon: <MessageSquare />, color: 'purple' },
          { label: 'Answers Given', value: stats.answers, icon: <Award />, color: 'blue' },
          { label: 'Accepted', value: stats.accepted, icon: <Check />, color: 'green' },
          { label: 'Global Rank', value: '#124', icon: <TrendingUp />, color: 'amber' }
        ].map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`p-2 rounded-lg bg-white/5 w-fit mx-auto mb-3 text-gray-400`}>
              {stat.icon}
            </div>
            <div className={`${styles.statValue} ${styles[stat.color]}`}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* 3. Learning Heatmap */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2>Activity Pulse</h2>
            </div>
            <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 overflow-x-auto">
              <StreakHeatmap />
            </div>
          </div>

          {/* 4. Real Activity Tabs */}
          <div className={styles.sectionCard}>
            <div className={styles.activityTabs}>
              <button 
                className={`${styles.activityTab} ${activeTab === 'questions' ? styles.active : ''}`}
                onClick={() => setActiveTab('questions')}
              >
                My Questions ({questions.length})
              </button>
              <button 
                className={`${styles.activityTab} ${activeTab === 'answers' ? styles.active : ''}`}
                onClick={() => setActiveTab('answers')}
              >
                Contributions ({answers.length})
              </button>
            </div>

            <div className={styles.activityContent}>
              <AnimatePresence mode="wait">
                {activeTab === 'questions' ? (
                  <motion.div 
                    key="questions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {questions.length > 0 ? questions.map(item => (
                      <Link href={`/doubts/${item.id}`} key={item.id} className={styles.activityItem}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={styles.activityItemTitle}>{item.title}</h4>
                          <span className={`${styles.statusBadge} ${styles[item.status]}`}>{item.status}</span>
                        </div>
                        <div className={styles.activityItemMeta}>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(item.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {item.answer_count || 0} answers</span>
                        </div>
                      </Link>
                    )) : <div className={styles.emptyState}>No questions asked yet.</div>}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="answers"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {answers.length > 0 ? answers.map(item => (
                      <Link href={`/doubts/${item.doubts?.id}`} key={item.id} className={styles.activityItem}>
                        <div className="text-[10px] uppercase font-bold text-blue-400 mb-1">Response to:</div>
                        <h4 className={styles.activityItemTitle}>{item.doubts?.title}</h4>
                        <p className={styles.answerPreview}>{item.content}</p>
                        <div className={styles.activityItemMeta}>
                          <span className="flex items-center gap-1 text-green-400"><Award className="w-3.5 h-3.5" /> {item.votes} votes</span>
                          {item.is_accepted && <span className="text-green-500 font-bold text-[10px] bg-green-500/10 px-2 py-0.5 rounded">ACCEPTED</span>}
                        </div>
                      </Link>
                    )) : <div className={styles.emptyState}>No contributions yet.</div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* 5. Quick Navigation Terminal */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <Rocket className="w-5 h-5 text-emerald-400" />
              <h2>Terminals</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {navActions.map((action, i) => (
                <Link key={i} href={action.href} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-all group">
                  <div className={`p-2.5 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{action.label}</div>
                    <div className="text-[11px] text-gray-500">Access Module</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* 6. Review Queue */}
          <PriorityLearningWidget />

          {/* 7. Achievements */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <Award className="w-5 h-5 text-amber-400" />
              <h2>Top Badges</h2>
            </div>
            <div className="flex flex-col gap-4">
              {badges.length > 0 ? badges.slice(0, 3).map((badge, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                    {getBadgeIcon(badge.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{badge.name}</h4>
                    <p className="text-[11px] text-gray-400">Unlocked on {new Date(badge.earned_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : <div className="text-center py-6 text-gray-500 text-sm">No badges yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
