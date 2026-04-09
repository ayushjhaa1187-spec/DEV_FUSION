'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Trophy, MessageSquare, User, Flame, Clock, Star, 
  Check, Edit3, Search, Bell, ChevronUp, ThumbsUp, 
  CheckCircle2, Lock, X, Mail, MapPin, Link as LinkIcon,
  Award, Zap, BookOpen, Target, ShieldCheck, HelpCircle
} from 'lucide-react';
import { authApi, doubtApi } from '@/lib/api';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, profile: authProfile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ answers: 0, accepted: 0, doubts: 0 });
  const [badges, setBadges] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', email: '', location: '', website: '' });
  const [isSaving, setIsSaving] = useState(false);

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
      setEditForm({
        name: profileData.profile?.full_name || '',
        bio: profileData.profile?.bio || '',
        email: user.email || '',
        location: profileData.profile?.location || 'San Francisco, CA',
        website: profileData.profile?.website || 'skillbridge.io'
      });
    } catch (err) {
      console.error('Error fetching profile data:', err);
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

  if (authLoading || loading) {
    return (
      <div className={styles.profileWrapper}>
        <div className={styles.profileContainer}>
          <Skeleton width="100%" height="300px" rounded />
        </div>
      </div>
    );
  }

  const initials = (profile?.full_name || user?.email || 'U').substring(0, 2).toUpperCase();
  const reputation = profile?.reputation_points || 0;

  const getBadgeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('answer')) return <MessageSquare />;
    if (t.includes('mentor')) return <User />;
    if (t.includes('star')) return <Star />;
    if (t.includes('speed')) return <Zap />;
    return <Trophy />;
  };

  return (
    <div className={styles.profileWrapper}>
      <div className={styles.profileContainer}>
        {/* 1. High-Fidelity Profile Header */}
        <section className={styles.profileHeaderSection}>
          <div className={styles.profileHeaderCard}>
            <div className={styles.profileHeaderContent}>
              <div className={styles.profileAvatarLarge}>{initials}</div>
              <div className={styles.profileHeaderInfo}>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className={styles.profileName}>{profile?.full_name || 'SkillBridge Learner'}</h1>
                  <div className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">Verified Pro</div>
                </div>
                <p className={styles.profileBio}>{profile?.bio || 'Passionate learner exploring the frontiers of knowledge on SkillBridge.'}</p>
                
                <div className="flex flex-wrap gap-6 mt-6">
                  <div className={styles.profileReputation}>
                    <Trophy className="w-5 h-5" />
                    <span>{reputation.toLocaleString()} Reputation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <MapPin className="w-4 h-4" /> {editForm.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-500 font-medium hover:underline cursor-pointer">
                    <LinkIcon className="w-4 h-4" /> {editForm.website}
                  </div>
                </div>
              </div>
              <button className={styles.btnEditProfile} onClick={() => setEditModalOpen(true)}>
                <Edit3 /> Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* 2. Stats Grid Section */}
        <div className={styles.statsRow}>
          {[
            { label: 'Doubts Asked', value: stats.doubts, color: 'blue' },
            { label: 'Answers Given', value: stats.answers, color: 'purple' },
            { label: 'Accepted Rate', value: '88%', color: 'green' },
            { label: 'Learning Streak', value: `${profile?.login_streak || 0} Days`, color: 'orange' }
          ].map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <div className={`${styles.statCardValue} ${styles[stat.color]}`}>{stat.value}</div>
              <div className={styles.statCardLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 3. Achievements & Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
             <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}><Award className="w-6 h-6 text-amber-500" /> Professional Badges</h2>
              <div className={styles.badgesGrid}>
                {badges.length > 0 ? badges.map((badge, i) => (
                  <div key={i} className={`${styles.badgeCard} ${styles.earned}`}>
                    <div className={styles.badgeIcon}>{getBadgeIcon(badge.name)}</div>
                    <div className={styles.badgeInfo}>
                      <h4 className={styles.badgeName}>{badge.name}</h4>
                      <p className={styles.badgeDescription}>{badge.description}</p>
                      <span className={styles.badgeDate}>Unlocked {new Date(badge.earned_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                    No badges earned yet. Start contributing to unlock rewards!
                  </div>
                )}
              </div>
            </div>

            {/* 4. Activity Terminal */}
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
                <AnimatePresence mode="wait">
                  {activeTab === 'questions' ? (
                    <motion.div 
                      key="questions"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex flex-col gap-4"
                    >
                      {questions.length > 0 ? questions.map((item) => (
                        <Link href={`/doubts/${item.id}`} key={item.id} className={styles.activityItem}>
                          <div className={styles.activityItemHeader}>
                            <h4 className={styles.activityItemTitle}>{item.title}</h4>
                            <span className={`${styles.statusBadge} ${styles[item.status]}`}>{item.status}</span>
                          </div>
                          <div className={styles.activityItemMeta}>
                            <div className={styles.metaItem}><MessageSquare className="w-4 h-4" /> {item.answer_count} answers</div>
                            <div className={styles.metaItem}><ThumbsUp className="w-4 h-4" /> {item.votes} upvotes</div>
                            <div className={styles.metaItem}><Clock className="w-4 h-4" /> {new Date(item.created_at).toLocaleDateString()}</div>
                          </div>
                        </Link>
                      )) : <div className="text-center py-10 text-gray-400">No questions asked yet.</div>}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="answers"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex flex-col gap-4"
                    >
                      {answers.length > 0 ? answers.map((item) => (
                        <Link href={`/doubts/${item.doubts?.id}`} key={item.id} className={styles.activityItem}>
                          <div className="text-[10px] font-bold text-blue-500 uppercase mb-2 tracking-widest">Contribution</div>
                          <h4 className={styles.activityItemTitle}>{item.doubts?.title}</h4>
                          <p className={styles.answerPreview}>{item.content}</p>
                          <div className={styles.activityItemMeta}>
                            <div className={`${styles.metaItem} text-green-600`}><Award className="w-4 h-4" /> {item.votes} votes</div>
                            {item.is_accepted && <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-50 text-green-600 font-bold text-[10px]">ACCEPTED</div>}
                            <div className={styles.metaItem}><Clock className="w-4 h-4" /> {new Date(item.created_at).toLocaleDateString()}</div>
                          </div>
                        </Link>
                      )) : <div className="text-center py-10 text-gray-400">No answers provided yet.</div>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* Sidebar Modules */}
            <div className={styles.sectionCard}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Account Security
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-sm font-semibold text-gray-700">Email Verification</div>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-sm font-semibold text-gray-700">2FA Security</div>
                  <button className="text-xs text-blue-600 font-bold hover:underline">Enable</button>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
              <Zap className="w-10 h-10 mb-4 text-yellow-300 fill-yellow-300" />
              <h3 className="text-xl font-extrabold mb-2">Upgrade to Plus</h3>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">Get early access to mentor sessions, priority doubt resolution, and exclusive industry resources.</p>
              <button className="w-full py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors">Start Free Trial</button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Enhanced Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className={`${styles.modalOverlay} ${styles.show}`} onClick={() => setEditModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.modal} 
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>Update Personal Info</h3>
                <button className={styles.modalClose} onClick={() => setEditModalOpen(false)}><X /></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Display Name</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    placeholder="Enter your name"
                    disabled={isSaving}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Professional Bio</label>
                  <textarea 
                    className={styles.formInput} 
                    rows={3} 
                    value={editForm.bio} 
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    disabled={isSaving}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Location</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    value={editForm.location} 
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.btnSecondary} onClick={() => setEditModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button className={styles.btnPrimary} onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
