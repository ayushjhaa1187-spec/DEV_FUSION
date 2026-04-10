'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

export default function MentorsPageClient() {
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
      filtered = filtered.filter(
        (m) =>
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
      filtered = [...filtered].sort(
        (a, b) => (b.mentor_profiles?.rating || 0) - (a.mentor_profiles?.rating || 0)
      );
    } else if (sortBy === 'sessions') {
      filtered = [...filtered].sort(
        (a, b) =>
          (b.mentor_profiles?.sessions_completed || 0) -
          (a.mentor_profiles?.sessions_completed || 0)
      );
    } else if (sortBy === 'price') {
      filtered = [...filtered].sort(
        (a, b) =>
          (a.mentor_profiles?.hourly_rate || 0) - (b.mentor_profiles?.hourly_rate || 0)
      );
    }
    setFilteredMentors(filtered);
  }, [mentors, searchQuery, subjectFilter, priceFilter, sortBy]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Expert Mentors</h1>
          <p className={styles.subtitle}>Book 1-on-1 sessions with senior students and experts in your field.</p>
        </div>
        <Link href="/mentors/apply" className={styles.applyBtn}>Become a Mentor</Link>
      </div>

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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.mentorCard}>
              <Skeleton className="h-64" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-accent)' }}>
          {error}
        </div>
      ) : filteredMentors.length > 0 ? (
        <div className={styles.mentorGrid}>
          {filteredMentors.map((mentor) => (
            <div key={mentor.id} className={styles.mentorCard}>
              <div className={styles.cardHeader}>
                <div className={styles.avatarContainer}>
                  {mentor.profiles?.avatar_url ? (
                    <Image
                      src={mentor.profiles.avatar_url}
                      alt={mentor.profiles?.username || ''}
                      width={72}
                      height={72}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {(mentor.profiles?.username || 'M')[0].toUpperCase()}
                    </div>
                  )}
                  <span className={styles.ratingBadge}>★ {mentor.mentor_profiles?.rating || '5.0'}</span>
                </div>
                <div>
                  <h3 className={styles.name}>
                    {mentor.profiles?.full_name || mentor.profiles?.username || 'Expert Mentor'}
                  </h3>
                  <p className={styles.specialty}>
                    {mentor.mentor_profiles?.specialty || 'General Academic'}
                  </p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.statLine}>
                  <span className={styles.statLabel}>Sessions</span>
                  <span className={styles.statValue}>{mentor.mentor_profiles?.sessions_completed || 0}+</span>
                </div>
                <div className={styles.statLine}>
                  <span className={styles.statLabel}>Rate</span>
                  <span className={`${styles.statValue} ${mentor.mentor_profiles?.hourly_rate === 0 ? styles.freeValue : ''}`}>
                    {mentor.mentor_profiles?.hourly_rate === 0
                      ? 'Free'
                      : `₹${mentor.mentor_profiles?.hourly_rate}/30min`}
                  </span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <Link href={`/mentors/${mentor.id}`} className={styles.viewProfileBtn}>Profile</Link>
                <Link href={`/mentors/${mentor.id}?book=1`} className={styles.bookBtn}>Book Session</Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🎓"
          title="No mentors found"
          description="Try adjusting your search or filters."
        />
      )}
    </div>
  );
}
