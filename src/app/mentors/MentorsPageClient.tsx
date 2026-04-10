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
        (a, b) => (b.mentor_profiles?.sessions_completed || 0) - (a.mentor_profiles?.sessions_completed || 0)
      );
    } else if (sortBy === 'price') {
      filtered = [...filtered].sort(
        (a, b) => (a.mentor_profiles?.hourly_rate || 0) - (b.mentor_profiles?.hourly_rate || 0)
      );
    }
    setFilteredMentors(filtered);
  }, [mentors, searchQuery, subjectFilter, priceFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Expert Mentors</h1>
          <p className="text-gray-400 text-lg mb-4">Book 1-on-1 sessions with senior students and experts in your field.</p>
          <Link
            href="/mentors/apply"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Become a Mentor →
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Search by name, skill, or subject..."
            className="flex-1 bg-white/5 border border-white/10 text-white py-3 px-6 rounded-xl outline-none focus:border-indigo-500/50 transition font-medium placeholder:text-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="bg-white/5 border border-white/10 text-white py-3 px-4 rounded-xl outline-none font-bold text-sm"
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
            className="bg-white/5 border border-white/10 text-white py-3 px-4 rounded-xl outline-none font-bold text-sm"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          >
            <option value="all">All Prices</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid Only</option>
          </select>
          <select
            className="bg-white/5 border border-white/10 text-white py-3 px-4 rounded-xl outline-none font-bold text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rating">Sort by Rating</option>
            <option value="sessions">Sort by Sessions</option>
            <option value="price">Sort by Price</option>
          </select>
        </div>

        {/* Mentor Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            {error}
          </div>
        ) : filteredMentors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  {mentor.profiles?.avatar_url ? (
                    <Image
                      src={mentor.profiles.avatar_url}
                      alt={mentor.profiles?.username || 'Mentor'}
                      width={56}
                      height={56}
                      className="rounded-full object-cover w-14 h-14"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                      {(mentor.profiles?.username || 'M')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">
                      {mentor.profiles?.full_name || mentor.profiles?.username || 'Expert Mentor'}
                    </h3>
                    <p className="text-gray-400 text-sm">{mentor.mentor_profiles?.specialty || 'General Academic'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span>★</span>
                    <span className="font-medium">{mentor.mentor_profiles?.rating || '5.0'}</span>
                  </div>
                  <div className="text-gray-400">
                    <span className="font-medium text-white">{mentor.mentor_profiles?.sessions_completed || 0}+</span> Sessions
                  </div>
                  <div className="font-semibold text-indigo-400">
                    {mentor.mentor_profiles?.hourly_rate === 0
                      ? 'Free'
                      : `₹${mentor.mentor_profiles?.hourly_rate}/30min`}
                  </div>
                </div>

                <Link
                  href={`/mentors/${mentor.id}`}
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No mentors found"
            description="Try adjusting your search or filters."
          />
        )}
      </div>
    </div>
  );
}
