'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { mentorApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import styles from './mentors.module.css';

interface Mentor {
  id: string;
  user_id: string;
  profiles?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  mentor_profiles?: {
    specialty: string;
    hourly_rate: number;
    rating: number;
    sessions_completed: number;
    skills?: string[];
    bio?: string;
  };
  reputation_points?: number;
  badges?: string[];
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    async function fetchMentors() {
      try {
        const data = await mentorApi.getMentors();
        setMentors(data || []);
        setFilteredMentors(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMentors();
  }, []);

  useEffect(() => {
    let filtered = mentors;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m) =>
        m.profiles?.username?.toLowerCase().includes(query) ||
        m.mentor_profiles?.specialty?.toLowerCase().includes(query) ||
        m.mentor_profiles?.bio?.toLowerCase().includes(query)
      );
    }

    if (subjectFilter !== 'all') {
      filtered = filtered.filter((m) =>
        m.mentor_profiles?.specialty?.toLowerCase().includes(subjectFilter.toLowerCase())
      );
    }

    if (priceFilter === 'free') {
      filtered = filtered.filter((m) => (m.mentor_profiles?.hourly_rate || 0) === 0);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter((m) => (m.mentor_profiles?.hourly_rate || 0) > 0);
    }

    if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => (b.mentor_profiles?.rating || 0) - (a.mentor_profiles?.rating || 0));
    } else if (sortBy === 'sessions') {
      filtered = [...filtered].sort((a, b) => (b.mentor_profiles?.sessions_completed || 0) - (a.mentor_profiles?.sessions_completed || 0));
    } else if (sortBy === 'price') {
      filtered = [...filtered].sort((a, b) => (a.mentor_profiles?.hourly_rate || 0) - (b.mentor_profiles?.hourly_rate || 0));
    }

    setFilteredMentors(filtered);
  }, [mentors, searchQuery, subjectFilter, priceFilter, sortBy]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Expert Mentors</h1>
          <p className={styles.subtitle}>
            Book 1-on-1 sessions with senior students and experts in your field.
          </p>
          <div className={styles.headerStats}>
            <div className={styles.statBadge}>
              <span className={styles.statNumber}>{filteredMentors.length}</span>
              <span className={styles.statLabel}>Available Mentors</span>
            </div>
            <div className={styles.statBadge}>
              <span className={styles.statNumber}>
                {filteredMentors.filter((m) => (m.mentor_profiles?.hourly_rate || 0) === 0).length}
              </span>
              <span className={styles.statLabel}>Free Sessions</span>
            </div>
          </div>
        </div>
        <Link href="/mentors/apply" className={styles.applyBtn}>
          Become a Mentor
        </Link>
      </header>

      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by name, skill, or subject..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <select
            className={styles.select}
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="all">All Subjects</option>
            <option value="computer">Computer Science</option>
            <option value="math">Mathematics</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="biology">Biology</option>
            <option value="engineering">Engineering</option>
          </select>
          <select
            className={styles.select}
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          >
            <option value="all">All Prices</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid Only</option>
          </select>
          <select
            className={styles.select}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rating">Sort by Rating</option>
            <option value="sessions">Sort by Sessions</option>
            <option value="price">Sort by Price</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.mentorGrid}>
          {[1, 2, 3, 4].map((i) => (
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
      ) : filteredMentors.length > 0 ? (
        <>
          <div className={styles.resultsCount}>
            Showing {filteredMentors.length} of {mentors.length} mentors
          </div>
          <div className={styles.mentorGrid}>
            {filteredMentors.map((mentor) => (
              <div key={mentor.id} className={`${styles.mentorCard} glass`}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatarContainer}>
                    {mentor.profiles?.avatar_url ? (
                      <img src={mentor.profiles.avatar_url} alt="" className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {(mentor.profiles?.username || 'M')[0].toUpperCase()}
                      </div>
                    )}
                    <div className={styles.ratingBadge}>★ {mentor.mentor_profiles?.rating || '5.0'}</div>
                  </div>
                  <div className={styles.headerInfo}>
                    <h3 className={styles.name}>{mentor.profiles?.full_name || mentor.profiles?.username || 'Expert Mentor'}</h3>
                    <p className={styles.specialty}>{mentor.mentor_profiles?.specialty || 'General Academic'}</p>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.stats}>
                    <div className={styles.statLine}>
                      <span className={styles.statLabel}>Sessions:</span>
                      <span className={styles.statValue}>{mentor.mentor_profiles?.sessions_completed || 0}+</span>
                    </div>
                    <div className={styles.statLine}>
                      <span className={styles.statLabel}>Rate:</span>
                      <span className={mentor.mentor_profiles?.hourly_rate === 0 ? styles.freeValue : styles.priceValue}>
                        {mentor.mentor_profiles?.hourly_rate === 0 ? 'Free' : `₹${mentor.mentor_profiles.hourly_rate}/30min`}
                      </span>
                    </div>
                  </div>
                  {mentor.reputation_points && mentor.reputation_points > 0 && (
                    <div className={styles.repLine}>
                      <span className={styles.repLabel}>Reputation:</span>
                      <span className={styles.repValue}>{mentor.reputation_points} pts</span>
                    </div>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  <Link href={`/mentors/${mentor.user_id}`} className={styles.viewProfileBtn}>
                    View Profile
                  </Link>
                  <Link href={`/mentors/${mentor.user_id}`} className={styles.bookBtn}>
                    Book Session
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon="🎓"
          title="No mentors found"
          description={
            searchQuery || subjectFilter !== 'all' || priceFilter !== 'all'
              ? "Try adjusting your search or filters to find the perfect mentor."
              : "The mentorship circle is waiting for its first experts. Use the 'Become a Mentor' button to lead the community!"
          }
        />
      )}
    </div>
  );
}
