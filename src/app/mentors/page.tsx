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
    <main>
      <h1>Expert Mentors</h1>
      <p>Book 1-on-1 sessions with senior students and experts in your field.</p>

      <div>
        <span>{filteredMentors.length} Available Mentors</span>
        <span>
          {filteredMentors.filter((m) => (m.mentor_profiles?.hourly_rate || 0) === 0).length} Free
          Sessions
        </span>
        <Link href="/mentors/apply">Become a Mentor</Link>
      </div>

      <input
        type="text"
        placeholder="Search by name, skill, or subject..."
        className={styles.searchInput}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

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

      {loading ? (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p>{error}</p>
      ) : filteredMentors.length > 0 ? (
        <>
          <p>
            Showing {filteredMentors.length} of {mentors.length} mentors
          </p>
          {filteredMentors.map((mentor) => (
            <div key={mentor.id} className={styles.mentorCard}>
              {mentor.profiles?.avatar_url ? (
                <Image
                  src={mentor.profiles.avatar_url}
                  alt={`${mentor.profiles?.full_name || mentor.profiles?.username || 'Mentor'}'s avatar`}
                  width={40}
                  height={40}
                  className="rounded-full"
                  loading="lazy"
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {(mentor.profiles?.username || 'M')[0].toUpperCase()}
                </div>
              )}

              <span>★ {mentor.mentor_profiles?.rating || '5.0'}</span>

              <h3>
                {mentor.profiles?.full_name ||
                  mentor.profiles?.username ||
                  'Expert Mentor'}
              </h3>
              <p>{mentor.mentor_profiles?.specialty || 'General Academic'}</p>

              <span>
                Sessions: {mentor.mentor_profiles?.sessions_completed || 0}+
              </span>
              <span>
                Rate:{' '}
                {mentor.mentor_profiles?.hourly_rate === 0
                  ? 'Free'
                  : `₹${mentor.mentor_profiles?.hourly_rate}/30min`}
              </span>

              {mentor.reputation_points && mentor.reputation_points > 0 && (
                <span>Reputation: {mentor.reputation_points} pts</span>
              )}

              <Link href={`/mentors/${mentor.id}`}>View Profile</Link>
              <Link href={`/mentors/${mentor.id}/book`}>Book Session</Link>
            </div>
          ))}
        </>
      ) : (
        <EmptyState />
      )}
    </main>
  );
}
