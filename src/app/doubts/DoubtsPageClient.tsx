'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { doubtApi, subjectApi, authApi } from '@/lib/api';
import { DoubtCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Search, X, Sparkles, Send, Filter, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export default function DoubtsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [doubts, setDoubts] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize from URL
  const [activeSubject, setActiveSubject] = useState<string | null>(searchParams.get('subject'));
  const [filterType, setFilterType] = useState(searchParams.get('filter') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [isChangingFilters, setIsChangingFilters] = useState(false);
  const searchDebounce = useRef<any>(null);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (activeSubject) params.set('subject', activeSubject);
    else params.delete('subject');
    
    if (filterType !== 'all') params.set('filter', filterType);
    else params.delete('filter');
    
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    else params.delete('q');

    const newUrl = `${pathname}?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      router.push(newUrl, { scroll: false });
    }
  }, [activeSubject, filterType, searchQuery, pathname, router, searchParams]);

  useEffect(() => {
    async function loadUserData() {
      try {
        const [profile, subs] = await Promise.all([
          authApi.getMyProfile(),
          authApi.getMySubjects()
        ]);
        setUserProfile(profile);
        setUserSubjects(subs.map((s: any) => s.subject_id));
      } catch (err) {
        console.error('Failed to load user context', err);
      }
    }
    loadUserData();
  }, []);

  const loadDoubts = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      
      // Sort mapping
      if (filterType === 'trending') {
        params.sort = 'trending';
      } else {
        params.sort = 'newest';
      }

      // Filter mapping
      if (activeSubject) params.subject_id = activeSubject;
      if (filterType === 'unanswered') params.filter = 'unanswered';
      if (filterType === 'my-branch' && userProfile?.branch) params.branch = userProfile.branch;
      if (filterType === 'my-subjects' && userSubjects.length > 0) {
        params.filter = 'my_subjects';
        params.user_subjects = userSubjects.join(',');
      }
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [doubtsData, subjectsData] = await Promise.all([
        doubtApi.getDoubts(params),
        subjectApi.getSubjects()
      ]);
      
      setDoubts(doubtsData || []);
      if (subjectsData) setSubjects(subjectsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load doubts');
    } finally {
      setLoading(false);
    }
  }, [activeSubject, filterType, userProfile, userSubjects, searchQuery]);

  useEffect(() => {
    loadDoubts(true);
  }, [loadDoubts]);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    
    const channel = supabase
      .channel('doubts-feed')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'doubts' 
      }, async (payload) => {
        // Fetch full doubt with relations for the new entry
        const { data: newDoubt, error } = await supabase
          .from('doubts')
          .select('*, subjects(name), profiles(username, avatar_url, reputation_points)')
          .eq('id', payload.new.id)
          .single();

        if (error || !newDoubt) return;

        // Check scroll position
        const isAtTop = window.scrollY < 100;

        if (isAtTop) {
          setDoubts(prev => [newDoubt, ...prev]);
        } else {
          toast.info('New doubt posted!', {
            action: {
              label: 'View',
              onClick: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setDoubts(prev => {
                  if (prev.find(d => d.id === newDoubt.id)) return prev;
                  return [newDoubt, ...prev];
                });
              }
            }
          });
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'doubts' 
      }, () => loadDoubts(false))
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [loadDoubts]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearchQuery(val);
    }, 400);
  };

  const filterButtons = [
    { key: 'all', label: 'Recent', icon: <Clock size={14} /> },
    { key: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
    { key: 'unanswered', label: 'Unanswered', icon: <Filter size={14} /> },
    ...(userProfile?.branch ? [{ key: 'my-branch', label: 'My Branch', icon: <Sparkles size={14} /> }] : []),
    ...(userSubjects.length > 0 ? [{ key: 'my-subjects', label: 'My Subjects', icon: <TrendingUp size={14} /> }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#06060c] selection:bg-indigo-500/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-indigo-600/5 border-b border-white/5 pt-24 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.15),transparent)] opacity-50" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-8"
          >
            <Sparkles size={14} />
            SkillBridge Network
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl lg:text-8xl font-black text-white tracking-tighter mb-8 leading-none"
          >
            Doubt Feed
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-xl max-w-2xl mx-auto font-medium"
          >
            Bridge the knowledge gap. Connect with mentors or solve doubts to earn reputation.
          </motion.p>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-40 bg-[#06060c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-8">
          <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            {filterButtons.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${
                  filterType === key 
                    ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-lg relative group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition" />
            <input
              type="text"
              placeholder="Search doubts by title, content or context..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-white/5 border border-white/5 rounded-3xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500/30 transition shadow-inner"
            />
          </div>

          <div className="flex items-center gap-6">
             <div className="hidden xl:flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Filter By Subject</span>
              <select 
                className="bg-transparent text-[10px] font-black text-white uppercase tracking-widest focus:outline-none cursor-pointer hover:text-indigo-400 transition"
                value={activeSubject || ''}
                onChange={(e) => setActiveSubject(e.target.value || null)}
              >
                <option value="" className="bg-[#0f0f1b]">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id} className="bg-[#0f0f1b]">{s.name}</option>)}
              </select>
            </div>
            <Link 
              href="/doubts/new"
              className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition shadow-[0_10px_30px_rgba(99,102,241,0.2)] whitespace-nowrap active:scale-95"
            >
              Ask Community
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => <DoubtCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-red-500/5 rounded-[32px] border border-red-500/10">
            <p className="text-red-400 font-bold text-lg mb-6">{error}</p>
            <button onClick={() => loadDoubts(true)} className="px-10 py-4 bg-red-500/20 text-red-400 rounded-2xl hover:bg-red-500/30 transition uppercase font-black text-[10px] tracking-widest">Retry Connection</button>
          </div>
        ) : doubts.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            <AnimatePresence mode="popLayout">
              {doubts.map((doubt) => (
                <motion.div
                  key={doubt.id}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  layout
                >
                  <Link 
                    href={`/doubts/${doubt.id}`} 
                    className="group relative h-full flex flex-col p-10 rounded-[40px] bg-[#0c0c16] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.5)] hover:-translate-y-2 overflow-hidden"
                  >
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition" />
                    
                    <div className="flex items-center justify-between mb-8">
                      <span className="px-4 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                        {doubt.subjects?.name || 'General'}
                      </span>
                      {doubt.status === 'resolved' && (
                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={12} />
                          Solved
                        </div>
                      )}
                      {doubt.votes > 0 && (
                        <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest ml-auto">
                          {doubt.votes} VIBES
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-black text-white mb-6 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-[1.2] tracking-tight">
                      {doubt.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-12 line-clamp-3 leading-[1.6] font-medium">
                      {doubt.content_text || 'Synthesizing conceptual breakdown... Click to explore detail.'}
                    </p>

                    <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {doubt.profiles?.avatar_url ? (
                          <img src={doubt.profiles.avatar_url} alt="" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white/5" />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white text-[10px] font-black ring-2 ring-white/5">
                            {doubt.profiles?.username?.[0] || 'L'}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tighter hover:text-indigo-400 transition cursor-pointer">
                            {doubt.profiles?.username || 'Learner'}
                          </p>
                          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                            {new Date(doubt.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                         <div className="w-1 h-1 rounded-full bg-indigo-500/10" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <EmptyState
            icon="💬"
            title={searchQuery ? `No results for "${searchQuery}"` : 'Zero Doubts Found'}
            description={searchQuery ? 'Our synaptic network couldn\'t find a match. Try broadening your query.' : 'The community is silent. Be the catalyst that starts the conversation.'}
            onAction={() => router.push('/doubts/new')}
          />
        )}
      </div>
    </div>
  );
}
