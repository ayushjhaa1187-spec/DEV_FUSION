'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakHeatmap } from '@/components/dashboard/StreakHeatmap';
import { Trophy, Zap, MessageSquare, BookOpen, User, Flame, ArrowRight, Target, Clock, Star, Check } from 'lucide-react';
import { authApi, doubtApi } from '@/lib/api';
import styles from './dashboard.module.css';

// Existing Widget
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

const getBadgeIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('answer')) return <MessageSquare size={24} />;
  if (n.includes('mentor')) return <User size={24} />;
  if (n.includes('star')) return <Star size={24} />;
  if (n.includes('quick') || n.includes('speed')) return <Clock size={24} />;
  if (n.includes('problem')) return <Check size={24} />;
  if (n.includes('expert') || n.includes('trophy')) return <Trophy size={24} />;
  return <Star size={24} />;
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({ answers: 0, accepted: 0, doubts: 0 });
  const [badges, setBadges] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('questions');
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '' });
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createSupabaseBrowser();

  const actions = [
    { href: '/doubts', label: 'Doubt Feed', icon: <MessageSquare />, color: 'bg-purple-500/10 text-purple-400' },
    { href: '/mentors', label: 'Book Expert', icon: <User />, color: 'bg-indigo-500/10 text-indigo-400' },
    { href: '/tests', label: 'AI Practice', icon: <Zap />, color: 'bg-amber-500/10 text-amber-400' },
    { href: '/resources', label: 'Library', icon: <BookOpen />, color: 'bg-emerald-500/10 text-emerald-400' },
  ];

  const fetchData = async () => {
    if (!user) return;
    try {
      const [profileData, questionsData, answersData, historyData] = await Promise.all([
        authApi.getMyProfile(),
        doubtApi.getDoubts({ author_id: user.id }),
        authApi.getMyAnswers(),
        supabase.from('practice_attempts').select('created_at, score').eq('user_id', user.id)
      ]);

      setProfile(profileData.profile);
      setStats(profileData.stats);
      setBadges(profileData.badges || []);
      setQuestions(questionsData);
      setAnswers(answersData);
      setHistory(historyData.data || []);
      
      setEditForm({
        name: profileData.profile?.full_name || '',
        bio: profileData.profile?.bio || ''
      });
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

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await authApi.updateProfile({ 
        full_name: editForm.name, 
        bio: editForm.bio 
      });
      await fetchData();
      setEditModalOpen(false);
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loading) return <div className="max-w-6xl mx-auto px-6 py-24"><Skeleton height="400px" width="100%" rounded /></div>;
  if (!user) return null;

  const displayPoints = profile?.reputation_points || 0;
  const initials = (profile?.full_name || user.email || 'U').substring(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white pt-[72px]">
      <div className={styles.dashboardContainer}>
        
        {/* Profile Header Block */}
        <section className={styles.section}>
          <div className={styles.headerCard}>
            <div className={styles.headerContent}>
              <div className={styles.avatarLarge}>{initials}</div>
              <div className={styles.headerInfo}>
                <h1 className={styles.name}>{profile?.full_name || user.email?.split('@')[0]}</h1>
                <p className={styles.bio}>{profile?.bio || 'SkillBridge member since 2024.'}</p>
                <div className={styles.reputation}>
                  <Trophy size={18} className="text-amber-500" />
                  <span>{displayPoints.toLocaleString()}</span> Reputation
                </div>
              </div>
              <button className={styles.btnEdit} onClick={() => setEditModalOpen(true)}>
                Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* Stats Row Block */}
        <section className={styles.section}>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.doubts || 0}</div>
              <div className={styles.statLabel}>Doubts Asked</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.answers || 0}</div>
              <div className={styles.statLabel}>Answers Given</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${styles.green}`}>{stats.accepted || 0}</div>
              <div className={styles.statLabel}>Accepted Answers</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${styles.blue}`}>
                 <div className="flex items-center justify-center gap-2">
                    <Flame size={24} className="text-orange-500" /> {profile?.login_streak || 0}
                 </div>
              </div>
              <div className={styles.statLabel}>Day Streak</div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 mt-4">
          <div className="lg:col-span-2 space-y-8">
            <div className={styles.sectionCard}>
               <h2 className={styles.sectionTitle}><Zap className="text-amber-400" /> Activity Heatmap</h2>
               <StreakHeatmap events={history} />
            </div>
          </div>
          <div className="space-y-6">
             <div className="bg-indigo-600 rounded-[32px] p-8 relative overflow-hidden group border-none">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <h3 className="text-xl font-black mb-4 relative z-10">Pro Upgrade</h3>
                <p className="text-indigo-100 text-xs mb-8 opacity-80 leading-relaxed relative z-10">Get unlimited AI doubts, premium courses, and certified industry badges.</p>
                <Link href="/pricing" className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-sm relative z-10 inline-block text-center">Upgrade Now</Link>
             </div>
          </div>
        </div>

        {/* Existing Widget */}
        <section className={styles.section}>
          <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                <Target size={18} />
             </div>
             <h2 className="text-2xl font-black font-heading tracking-tight">Concept Review Queue</h2>
          </div>
          <WeakAreasWidget />
        </section>

        {/* Live Badges */}
        <section className={styles.section}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}><Trophy className="text-amber-400" /> Achievement Badges</h2>
            {badges.length > 0 ? (
              <div className={styles.badgesGrid}>
                {badges.map((badge, idx) => (
                  <div key={idx} className={`${styles.badgeCard} ${styles.earned}`}>
                    <div className={styles.badgeIcon}>
                      {getBadgeIcon(badge.name)}
                    </div>
                    <div className={styles.badgeInfo}>
                      <h4 className={styles.badgeName}>{badge.name}</h4>
                      <p className={styles.badgeDescription}>{badge.description}</p>
                      <span className={styles.badgeDate}>Earned {new Date(badge.earned_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Trophy size={48} className="opacity-20" />
                <p>No badges earned yet. Keep solving doubts to unlock rewards!</p>
              </div>
            )}
          </div>
        </section>

        {/* Real Activity Tabs */}
        <section className={styles.section}>
          <div className={styles.sectionCard}>
            <div className={styles.activityTabs}>
              <button 
                className={`${styles.activityTab} ${activeTab === 'questions' ? styles.active : ''}`}
                onClick={() => setActiveTab('questions')}
              >
                Questions ({questions.length})
              </button>
              <button 
                className={`${styles.activityTab} ${activeTab === 'answers' ? styles.active : ''}`}
                onClick={() => setActiveTab('answers')}
              >
                Answers ({answers.length})
              </button>
            </div>
            
            <div className={styles.activityContent}>
              {activeTab === 'questions' && (
                questions.length > 0 ? questions.map(item => (
                  <Link href={`/doubts/${item.id}`} key={item.id} className={styles.activityItem}>
                    <div className={styles.activityItemHeader}>
                      <h4 className={styles.activityItemTitle}>{item.title}</h4>
                      <span className={`${styles.statusBadge} ${styles[item.status || 'unanswered']}`}>
                        {item.status === 'solved' ? 'Solved' : 'Unanswered'}
                      </span>
                    </div>
                    <div className={styles.doubtTags}>
                      <span className={styles.tag}>{item.subjects?.name}</span>
                    </div>
                    <div className={styles.activityItemMeta}>
                      <span className={styles.metaItem}>
                        <MessageSquare size={14} /> {item.answer_count || 0} answers
                      </span>
                      <span className={styles.metaItem}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                )) : (
                  <div className={styles.emptyState}>
                    <p>You haven't posted any questions yet.</p>
                  </div>
                )
              )}
              
              {activeTab === 'answers' && (
                answers.length > 0 ? answers.map(item => (
                  <Link href={`/doubts/${item.doubt_id}`} key={item.id} className={styles.activityItem}>
                    <div className={styles.activityItemHeader}>
                      <span className={styles.answerLabel}>Answered:</span>
                      <h4 className={styles.activityItemTitle}>{item.doubts?.title}</h4>
                      <span className={`${styles.statusBadge} ${item.is_accepted ? styles.solved : styles.unanswered}`}>
                        {item.is_accepted ? 'Accepted' : 'Pending'}
                      </span>
                    </div>
                    <p className={styles.answerPreview}>{item.content.substring(0, 150)}...</p>
                    <div className={styles.activityItemMeta}>
                      <span className={styles.metaItem}>
                        <Flame size={14} className="text-orange-500" /> {item.votes} votes
                      </span>
                      <span className={styles.metaItem}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                )) : (
                  <div className={styles.emptyState}>
                    <p>You haven't provided any answers yet.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Existing Navigation Grid */}
        <section className={styles.section}>
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

        <div className="mt-12 pt-8 border-t border-white/5 flex justify-center">
           <button 
             onClick={signOut}
             className="px-8 py-3 rounded-full border border-white/10 text-gray-500 font-bold hover:text-white hover:bg-white/5 transition-all text-sm"
           >
             Sign Out Session
           </button>
        </div>

      </div>

      {isEditModalOpen && (
        <div className={`${styles.modalOverlay} ${styles.show}`} onClick={() => setEditModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit Profile</h3>
              <button className={styles.modalClose} onClick={() => setEditModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  disabled={isSaving}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Bio</label>
                <textarea 
                  className={styles.formInput} 
                  rows={3}
                  value={editForm.bio}
                  onChange={e => setEditForm({...editForm, bio: e.target.value})}
                  disabled={isSaving}
                ></textarea>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setEditModalOpen(false)} disabled={isSaving}>Cancel</button>
              <button className={styles.btnPrimaryCustom} onClick={handleUpdateProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

