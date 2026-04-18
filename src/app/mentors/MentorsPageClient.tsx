'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { mentorApi, authApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Search, Filter, Star, Users, ArrowRight, ShieldCheck, Sparkles, GraduationCap, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Mentor {
  id: string;
  profiles: {
    username: string;
    full_name?: string;
    avatar_url?: string;
    branch?: string;
    college?: string;
  };
  specialty?: string;
  price_per_session?: number;
  rating?: number;
  sessions_completed?: number;
  skills?: string[];
  bio?: string;
}

export default function MentorsPageClient() {
  const router = useRouter();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (activeFilter === 'my-branch' && userProfile?.branch) {
        params.branch = userProfile.branch;
      }
      if (searchQuery) {
        params.specialty = searchQuery;
      }
      const data = await mentorApi.getMentors(params);
      
      // Handle standardized response or raw array
      const mentorsList = Array.isArray(data) ? data : (data?.success ? data.data : []);
      setMentors(mentorsList || []);
    } catch (err: any) {
      console.error('Fetch mentors error:', err);
      setError(err.message || 'Failed to connect to the mentor network. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, userProfile, searchQuery]);

  useEffect(() => {
    async function loadUser() {
      try {
        const profile = await authApi.getMyProfile();
        setUserProfile(profile);
      } catch (err) {
        console.error('Failed to load user profile');
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  return (
    <div className="min-h-screen bg-[#06060c] selection:bg-indigo-500/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-indigo-600/5 border-b border-white/5 pt-24 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.15),transparent)] opacity-50" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-8"
              >
                <ShieldCheck size={14} />
                Verified Mentors Only
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl lg:text-8xl font-black text-white tracking-tighter mb-8 leading-none"
              >
                Expert <br />Guidance.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 text-xl font-medium"
              >
                Connect 1-on-1 with top-rated students and experts. Break through your academic blockers in 30 minutes.
              </motion.p>
            </div>
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3 }}
               className="flex flex-col items-center gap-4 bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-xl"
            >
              <div className="flex -space-x-3 mb-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#06060c] bg-indigo-600 flex items-center justify-center text-[10px] font-black" />
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Join 500+ Mentors</p>
              <Link href="/mentors/apply" className="px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-200 transition active:scale-95">
                Apply Now
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-40 bg-[#06060c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeFilter === 'all' 
                  ? 'bg-white text-black shadow-xl' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              All Experts
            </button>
            {userProfile?.branch && (
              <button
                onClick={() => setActiveFilter('my-branch')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeFilter === 'my-branch' 
                    ? 'bg-indigo-600 text-white shadow-xl' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                My Branch
              </button>
            )}
          </div>

          <div className="flex-1 max-w-lg relative group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition" />
            <input
              type="text"
              placeholder="Search by specialty (e.g. React, DS, Physics)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-white/5 border border-white/5 rounded-3xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500/30 transition shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Mentor Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] rounded-[48px] bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : mentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {mentors.map((mentor) => (
              <Link 
                key={mentor.id} 
                href={`/mentors/${mentor.id}`} 
                className="group relative flex flex-col p-10 rounded-[48px] bg-[#0c0c16] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.5)] hover:-translate-y-2 overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition" />
                
                <div className="flex items-start justify-between mb-8">
                   <div className="relative">
                      {mentor.profiles?.avatar_url ? (
                        <img src={mentor.profiles.avatar_url} alt="" className="w-20 h-20 rounded-3xl object-cover ring-2 ring-white/5" />
                      ) : (
                        <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black">
                          {mentor.profiles?.username?.[0] || 'M'}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-white text-black text-[10px] font-black rounded-lg shadow-xl">
                        ★ {mentor.rating || '5.0'}
                      </div>
                   </div>

                   <div className="px-4 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                      {mentor.profiles?.branch || 'General'}
                   </div>
                </div>

                <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-indigo-400 transition-colors">
                  {mentor.profiles?.full_name || mentor.profiles?.username}
                </h3>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">
                  {mentor.specialty || 'Academic Mentor'}
                </p>

                <p className="text-gray-500 text-sm mb-10 line-clamp-3 leading-relaxed font-normal">
                  {mentor.bio || 'Expert guidance for conceptual breakthroughs and project-based learning.'}
                </p>

                <div className="mt-auto grid grid-cols-2 gap-4 pt-8 border-t border-white/5">
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Completed</span>
                      <span className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                        <Users size={14} className="text-indigo-500" />
                        {mentor.sessions_completed || 0}+ Sessions
                      </span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Consultation</span>
                      <span className="text-sm font-black text-white tracking-tight">
                        {mentor.price_per_session === 0 ? (
                          <span className="text-emerald-400">Scholar-Free</span>
                        ) : (
                          `₹${mentor.price_per_session}/30m`
                        )}
                      </span>
                   </div>
                </div>

                <div className="mt-8 flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                   Book Strategic session
                   <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🎓"
            title="Zero Mentors Found"
            description="Our network is expanding. Try adjusting your search parameters to find the perfect guide."
            onAction={() => { setActiveFilter('all'); setSearchQuery(''); }}
          />
        )}
      </div>
    </div>
  );
}
