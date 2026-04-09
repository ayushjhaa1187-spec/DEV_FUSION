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
    <main className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black mb-4">Expert Mentors</h1>
          <p className="text-gray-500 max-w-xl">Book 1-on-1 sessions with senior students and experts in your field.</p>
        </div>
        <Link href="/mentors/apply" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition">
          Become a Mentor
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-12 p-6 bg-white/5 border border-white/5 rounded-[32px]">
        <div className="flex-1 min-w-[300px] relative">
           <input
            type="text"
            placeholder="Search by name, skill, or subject..."
            className="w-full bg-white/5 border border-white/10 py-3 px-6 rounded-xl outline-none focus:border-indigo-500/50 transition font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <select
            className="bg-white/5 border border-white/10 py-3 px-4 rounded-xl outline-none font-bold text-sm"
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
            className="bg-white/5 border border-white/10 py-3 px-4 rounded-xl outline-none font-bold text-sm"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          >
            <option value="all">All Prices</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid Only</option>
          </select>

          <select
            className="bg-white/5 border border-white/10 py-3 px-4 rounded-xl outline-none font-bold text-sm"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white/5 rounded-[40px] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-red-500/5 rounded-[40px] border border-red-500/10">
          <p className="text-red-400 font-bold">{error}</p>
        </div>
      ) : filteredMentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMentors.map((mentor) => (
            <div key={mentor.id} className="group bg-white/5 border border-white/5 rounded-[40px] p-8 hover:border-indigo-500/20 transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  {mentor.profiles?.avatar_url ? (
                    <Image
                      src={mentor.profiles.avatar_url}
                      alt=""
                      width={64}
                      height={64}
                      className="rounded-2xl"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-2xl font-black text-indigo-400 uppercase">
                      {(mentor.profiles?.username || 'M')[0]}
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-[#0d0d1a] border border-white/5 px-2 py-1 rounded-lg text-[10px] font-black text-amber-500 flex items-center gap-1">
                    ★ {mentor.mentor_profiles?.rating || '5.0'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Sessions</div>
                  <div className="text-xl font-black">{mentor.mentor_profiles?.sessions_completed || 0}+</div>
                </div>
              </div>

              <h3 className="text-2xl font-black mb-1 group-hover:text-indigo-400 transition-colors">
                {mentor.profiles?.full_name || mentor.profiles?.username || 'Expert Mentor'}
              </h3>
              <p className="text-sm font-bold text-gray-400 mb-8">{mentor.mentor_profiles?.specialty || 'General Academic'}</p>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div>
                  <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Rate</div>
                  <div className={`text-lg font-black ${mentor.mentor_profiles?.hourly_rate === 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {mentor.mentor_profiles?.hourly_rate === 0 ? 'Free' : `₹${mentor.mentor_profiles?.hourly_rate}/30min`}
                  </div>
                </div>
                <Link href={`/mentors/${mentor.id}`} className="px-6 py-3 bg-white/5 hover:bg-indigo-600 text-sm font-black rounded-2xl transition-all">
                  Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon="🎓"
          title="No mentors found"
          description="Try broading your search or selecting a different subject."
        />
      )}
    </main>
  );
}
