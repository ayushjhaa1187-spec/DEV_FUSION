'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { authApi } from '@/lib/api';
import BadgeGrid from '@/components/user/BadgeGrid';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      authApi.getMyProfile().then(setData).catch(console.error).finally(() => setIsLoading(false));
    }
  }, [user]);

  if (!user) {
    return (
      <div className={styles.container}>
        <div className="glass card text-center p-5">
           <h2>Access Denied</h2>
           <p>Log in to view your learning analytics and reputation history.</p>
           <a href="/auth" className="btn btn-primary mt-3">Log In</a>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className={styles.container}><p>Analyzing Academic Portfolio...</p></div>;

  const { profile, stats, history } = data || {};

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.avatarWrap}>
          <img 
            src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} 
            alt={profile?.username} 
            className={styles.avatar}
          />
          <div className={styles.badge}>Level {Math.floor((profile?.reputation_points || 0) / 100) + 1}</div>
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.username}>{profile?.full_name || profile?.username}</h1>
          <p className={styles.branch}>{profile?.branch || 'General Member'} · {profile?.semester ? `Sem ${profile.semester}` : 'Freshman'}</p>
          <p className={styles.bio}>{profile?.bio || 'Passionate about peer learning and skill growth.'}</p>
        </div>
        <div className={styles.reputationCard}>
          <div className={styles.repValue}>{profile?.reputation_points || 0}</div>
          <div className={styles.repLabel}>Total Reputation</div>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Doubts Posted</h3>
          <div className={styles.statValue}>{stats?.doubts}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Solutions Provided</h3>
          <div className={styles.statValue}>{stats?.answers}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Accepted Solutions</h3>
          <div className={styles.statValue}>{stats?.accepted}</div>
          {stats?.accepted >= 5 && <div className={styles.badgeLabel}>Expert Resolver 🌟</div>}
        </div>
      </section>

      <section className={styles.badgeSection}>
        <h2 className={styles.sectionTitle}>Achievement Badges</h2>
        <BadgeGrid points={profile?.reputation_points || 0} />
      </section>

      <section className={styles.historySection}>
        <h2 className={styles.sectionTitle}>Reputation History</h2>
        <div className={styles.timeline}>
          {history?.length > 0 ? history.map((event: any) => (
            <div key={event.id} className={styles.timelineItem}>
              <div className={styles.timeDot}></div>
              <div className={styles.timeContent}>
                 <div className={styles.timeMeta}>
                    <span className={styles.timeDate}>{new Date(event.created_at).toLocaleDateString()}</span>
                    <span className={styles.points}>+{event.points}</span>
                 </div>
                 <p className={styles.eventText}>
                    {event.event_type.replace(/_/g, ' ').toUpperCase()}: 
                    {event.event_type === 'answer_posted' && ' Contributed a helpful solution'}
                    {event.event_type === 'answer_accepted' && ' Solution was accepted by author'}
                    {event.event_type === 'test_complete' && ' Completed an AI practice test'}
                 </p>
              </div>
            </div>
          )) : (
            <p className={styles.empty}>No recent activity found. Start contributing to earn points!</p>
          )}
        </div>
      </section>
    </div>
  );
}
