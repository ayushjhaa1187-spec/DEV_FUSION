'use client';

import { useEffect, useState } from 'react';
import styles from './mentors.module.css';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMentors() {
      try {
        const response = await fetch('/api/mentors');
        if (!response.ok) throw new Error('Failed to load mentors');
        const data = await response.json();
        setMentors(data);
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
          <h1 className={styles.title}>Verified Mentors</h1>
          <p className={styles.subtitle}>Connect with experts for 1-on-1 guidance and academic success.</p>
        </div>
        <button className={styles.applyBtn}>Become a Mentor</button>
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
        <div className={styles.loading}>Finding best mentors for you...</div>
      ) : error ? (
        <div className={styles.errorBanner}>{error}</div>
      ) : (
        <div className={styles.mentorGrid}>
          {mentors.map((mentor) => (
            <div key={mentor.id} className={`${styles.mentorCard} glass`}>
              <div className={styles.cardHeader}>
                <div className={styles.avatarContainer}>
                  {mentor.profiles?.avatar_url ? (
                    <img src={mentor.profiles.avatar_url} alt={mentor.profiles.username} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder} />
                  )}
                  <div className={styles.ratingBadge}>★ {mentor.rating || '5.0'}</div>
                </div>
                <div className={styles.headerInfo}>
                  <h3 className={styles.name}>{mentor.profiles?.full_name || mentor.profiles?.username || 'Mentor'}</h3>
                  <p className={styles.specialty}>{mentor.specialty}</p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.stats}>
                  <div className={styles.statLine}>
                    <span className={styles.statLabel}>Completed Sessions:</span>
                    <span className={styles.statValue}>{mentor.sessions_completed}+</span>
                  </div>
                  <div className={styles.statLine}>
                    <span className={styles.statLabel}>Rate:</span>
                    <span className={mentor.price_per_session === 0 ? styles.freeValue : styles.priceValue}>
                      {mentor.price_per_session === 0 ? 'Free' : `₹${mentor.price_per_session}/30min`}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.viewProfileBtn}>View Profile</button>
                <button className={styles.bookBtn}>Book Session</button>
              </div>
            </div>
          ))}
          {mentors.length === 0 && <p className={styles.emptyState}>No mentors available at the moment.</p>}
        </div>
      )}
    </div>
  );
}

