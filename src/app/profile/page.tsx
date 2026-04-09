'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Trophy, 
  MessageSquare, 
  User, 
  Flame, 
  Clock, 
  Star, 
  Check, 
  Edit3, 
  Search, 
  Bell, 
  ChevronUp, 
  ThumbsUp, 
  CheckCircle2,
  Lock,
  X
} from 'lucide-react';
import { authApi, doubtApi } from '@/lib/api';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, profile: authProfile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({ answers: 0, accepted: 0, doubts: 0 });
  const [badges, setBadges] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createSupabaseBrowser();

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
        email: user.email || ''
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
          <Skeleton height="300px" width="100%" rounded />
          <div className="grid grid-cols-4 gap-6">
            <Skeleton height="120px" width="100%" rounded />
            <Skeleton height="120px" width="100%" rounded />
            <Skeleton height="120px" width="100%" rounded />
            <Skeleton height="120px" width="100%" rounded />
          </div>
          <Skeleton height="400px" width="100%" rounded />
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
    if (t.includes('speed') || t.includes('quick')) return <Clock />;
    if (t.includes('problem')) return <CheckCircle2 />;
    if (t.includes('expert') || t.includes('trophy')) return <Trophy />;
    return <Star />;
  };

  return (
    <div className={styles.profileWrapper}>
      <div className={styles.profileContainer}>
        
        {/* Profile Header Section */}
        <section className={styles.profileHeaderSection}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.profileHeaderCard}
          >
            <div className={styles.profileHeaderContent}>
              <div className={styles.profileAvatarLarge}>{initials}</div>
              <div className={styles.profileHeaderInfo}>
                <h1 className={styles.profileName}>{profile?.full_name || 'Student'}</h1>
                <p className={styles.profileBio}>
                  {profile?.bio || 'Passionate learner exploring the frontiers of knowledge on SkillBridge.'}
                </p>
                <div className={styles.profileReputation}>
                  <Star fill="#f59e0b" color="#f59e0b" size={18} />
                  <span>{reputation.toLocaleString()}</span> Reputation
                </div>
              </div>
              <button className={styles.btnEditProfile} onClick={() => setEditModalOpen(true)}>
                <Edit3 size={16} />
                Edit Profile
              </button>
            </div>
          </motion.div>
        </section>

        {/* Stats Row Section */}
        <section className={styles.profileStatsSection}>
          <div className={styles.statsRow}>
            {[
              { label: 'Doubts Asked', value: stats.doubts || 0, color: '' },
              { label: 'Answers Given', value: stats.answers || 0, color: '' },
              { label: 'Accepted Answers', value: stats.accepted || 0, color: 'green' },
              { label: 'Day Streak', value: profile?.login_streak || 0, color: 'blue', icon: <Flame size={20} className="text-orange-500" /> }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className={styles.statCard}
              >
                <div className={`${styles.statCardValue} ${stat.color === 'blue' ? styles.blue : stat.color === 'green' ? styles.green : ''}`}>
                  {stat.icon && <span className="inline-block mr-2">{stat.icon}</span>}
                  {stat.value}
                </div>
                <div className={styles.statCardLabel}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Badges Section */}
        <section className={styles.profileBadgesSection}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Trophy size={20} className="text-amber-500" />
              Badges
            </h2>
            <div className={styles.badgesGrid}>
              {badges.length > 0 ? badges.map((badge, i) => (
                <div key={i} className={`${styles.badgeCard} ${styles.earned}`}>
                  <div className={styles.badgeIcon}>
                    {getBadgeIcon(badge.name)}
                  </div>
                  <div className={styles.badgeInfo}>
                    <h4 className={styles.badgeName}>{badge.name}</h4>
                    <p className={styles.badgeDescription}>{badge.description}</p>
                    <span className={styles.badgeDate}>Earned {new Date(badge.earned_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center w-full col-span-full text-gray-400">
                  <p>No badges earned yet. Start contributing to unlock achievement markers!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Activity Section */}
        <section className={styles.profileActivitySection}>
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
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {questions.length > 0 ? questions.map((item) => (
                      <Link href={`/doubts/${item.id}`} key={item.id} className={styles.activityItem}>
                        <div className={styles.activityItemHeader}>
                          <h4 className={styles.activityItemTitle}>{item.title}</h4>
                          <span className={`${styles.statusBadge} ${item.status === 'solved' ? styles.solved : styles.unanswered}`}>
                            {item.status === 'solved' ? 'Solved' : 'Unanswered'}
                          </span>
                        </div>
                        <div className={styles.activityItemMeta}>
                          <span className={styles.metaItem}>
                            <MessageSquare size={14} /> {item.answer_count || 0} answers
                          </span>
                          <span className={styles.metaItem}>
                            <ThumbsUp size={14} /> {item.votes || 0} upvotes
                          </span>
                          <span className={styles.metaItem}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    )) : (
                      <div className="py-20 text-center text-gray-400">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                        <p>No questions asked yet.</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="answers"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {answers.length > 0 ? answers.map((item) => (
                      <Link href={`/doubts/${item.doubt_id}`} key={item.id} className={styles.activityItem}>
                        <div className={styles.activityItemHeader}>
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Answered:</span>
                            <h4 className={styles.activityItemTitle}>{item.doubts?.title}</h4>
                          </div>
                          <span className={`${styles.statusBadge} ${item.is_accepted ? styles.solved : styles.unanswered}`}>
                            {item.is_accepted ? 'Accepted' : 'Pending'}
                          </span>
                        </div>
                        <p className={styles.answerPreview}>{item.content}</p>
                        <div className={styles.activityItemMeta}>
                          <span className={styles.metaItem}>
                            <ThumbsUp size={14} /> {item.votes || 0} votes
                          </span>
                          <span className={styles.metaItem}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    )) : (
                      <div className="py-20 text-center text-gray-400">
                        <Edit3 size={48} className="mx-auto mb-4 opacity-10" />
                        <p>No answers provided yet.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>

      {/* Edit Profile Modal */}
      <div className={`${styles.modalOverlay} ${isEditModalOpen ? styles.show : ''}`} onClick={() => setEditModalOpen(false)}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Edit Profile</h3>
            <button className={styles.modalClose} onClick={() => setEditModalOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input 
                type="text" 
                className={styles.formInput} 
                value={editForm.name}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                placeholder="Enter your name"
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
                placeholder="Tell us about yourself..."
                disabled={isSaving}
              ></textarea>
            </div>
            <div className={styles.formGroup}>
              <label>Email (Read-only)</label>
              <input 
                type="email" 
                className={styles.formInput} 
                value={editForm.email}
                readOnly
                disabled
              />
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.btnSecondary} onClick={() => setEditModalOpen(false)} disabled={isSaving}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleUpdateProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
