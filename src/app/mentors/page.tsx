'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { mentorApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import styles from './mentors.module.css';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMentors() {
      try {
        const data = await mentorApi.getMentors();
        setMentors(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMentors();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Expert Mentors</h1>
          <p className={styles.subtitle}>Book 1-on-1 sessions with senior students and experts in your field.</p>
        </div>
        <Link href="/mentors/apply" className={styles.applyBtn}>Become a Mentor</Link>
      </header>

      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <input type="text" placeholder="Search by name, skill, or subject..." className={styles.searchInput} />
        </div>
        <div className={styles.filters}>
          <select className={styles.select}>
            <option>All Subjects</option>
            <option>Computer Science</option>
            <option>Mathematics</option>
          </select>
          <select className={styles.select}>
            <option>Session Price</option>
            <option>Free</option>
            <option>Paid</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.mentorGrid}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`${styles.mentorCard} glass`} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <Skeleton width="64px" height="64px" rounded />
                <div style={{ flex: 1 }}>
                  <Skeleton width="60%" height="1.2rem" className="mb-2" />
                  <Skeleton width="40%" height="1rem" />
                </div>
              </div>
              <Skeleton width="100%" height="3rem" className="mb-4" />
              <div style={{ display: 'flex', gap: '12px' }}>
                <Skeleton width="50%" height="36px" rounded />
                <Skeleton width="50%" height="36px" rounded />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={styles.errorBanner}>{error}</div>
      ) : mentors.length > 0 ? (
        <div className={styles.mentorGrid}>
          {mentors.map((mentor) => (
            <div key={mentor.id} className={`${styles.mentorCard} glass`}>
              <div className={styles.cardHeader}>
                <div className={styles.avatarContainer}>
                  {mentor.profiles?.avatar_url ? (
                    <img src={mentor.profiles.avatar_url} alt="" className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder} />
                  )}
                  <div className={styles.ratingBadge}>★ {mentor.rating || '5.0'}</div>
                </div>
                <div className={styles.headerInfo}>
                  <h3 className={styles.name}>{mentor.profiles?.username || 'Expert Mentor'}</h3>
                  <p className={styles.specialty}>{mentor.specialty || 'General Academic'}</p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.stats}>
                  <div className={styles.statLine}>
                    <span className={styles.statLabel}>Completed Sessions:</span>
                    <span className={styles.statValue}>{mentor.sessions_completed || 0}+</span>
                  </div>
                  <div className={styles.statLine}>
                    <span className={styles.statLabel}>Rate:</span>
                    <span className={mentor.hourly_rate === 0 ? styles.freeValue : styles.priceValue}>
                      {mentor.hourly_rate === 0 ? 'Free' : `₹${mentor.hourly_rate}/30min`}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <Link href={`/mentors/${mentor.user_id}`} className={styles.viewProfileBtn}>View Profile</Link>
                <Link href={`/mentors/${mentor.user_id}`} className={styles.bookBtn}>Book Session</Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon="🎓" 
          title="No mentors yet — be the first!" 
          description="The mentorship circle is waiting for its first experts. Use the 'Become a Mentor' button to lead the community!" 
        />
      )}
    </div>
  );
}
