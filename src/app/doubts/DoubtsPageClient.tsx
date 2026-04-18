'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { doubtApi, subjectApi, authApi } from '@/lib/api';
import { DoubtCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Search, X, Sparkles, Send, Filter, Clock, TrendingUp, CheckCircle2, ChevronRight, MessageSquare as MsgIcon, BookOpen, Target } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSafeRealtime } from '@/hooks/useSafeRealtime';
import { toast } from 'sonner';
import ErrorState from '@/components/ui/ErrorState';

export default function DoubtsPageClient() {
// ... existing state ...
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

  // Stagger variants
  const containerVars = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    }
  };

  // ... rest of the logic (unchanged) ...
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
      if (filterType === 'trending') params.sort = 'trending';
      else params.sort = 'newest';
      if (activeSubject) params.subject_id = activeSubject;
      if (filterType === 'unanswered') params.filter = 'unanswered';
      if (filterType === 'my-branch' && userProfile?.branch) params.branch = userProfile.branch;
      if (filterType === 'my-semester' && userProfile?.semester) params.semester = userProfile.semester;
      if (filterType === 'my-subjects' && userSubjects.length > 0) params.filter = 'my_subjects';
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const [res, subjectsData] = await Promise.all([
        doubtApi.getDoubts(params),
        subjectApi.getSubjects()
      ]);
      setDoubts(res.doubts || []);
      if (subjectsData) setSubjects(subjectsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load doubts');
    } finally {
      setLoading(false);
    }
  }, [activeSubject, filterType, userProfile, userSubjects, searchQuery]);

  const { supabase } = useSafeRealtime('doubts-hub', [
    {
      event: 'INSERT',
      table: 'doubts',
      handler: async (payload) => {
        const { data: newDoubt } = await supabase.from('doubts')
          .select('*, subjects(name), profiles(username, avatar_url, reputation_points)')
          .eq('id', payload.new.id).single();
        if (!newDoubt) return;
        
        setDoubts(prev => {
          if (prev.find(d => d.id === newDoubt.id)) return prev;
          
          // Auto-inject if at the top, otherwise show toast
          if (typeof window !== 'undefined' && window.scrollY < 100) {
            return [newDoubt, ...prev];
          }
          
          toast.info('New doubt posted in the community!', {
            icon: '💬',
            action: { 
              label: 'View', 
              onClick: () => { 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
                setDoubts(current => [newDoubt, ...current.filter(d => d.id !== newDoubt.id)]); 
              } 
            }
          });
          return prev;
        });
      }
    },
    {
      event: 'UPDATE',
      table: 'doubts',
      handler: (payload) => {
        console.log('[Realtime] Doubt updated in feed:', payload.new.id);
        setDoubts(prev => prev.map(d => d.id === payload.new.id ? { ...d, ...payload.new } : d));
      }
    },
    {
      event: 'DELETE',
      table: 'doubts',
      handler: (payload) => {
        console.log('[Realtime] Doubt purged from feed:', payload.old.id);
        setDoubts(prev => prev.filter(d => d.id !== payload.old.id));
      }
    }
  ]);

  useEffect(() => { loadDoubts(true); }, [loadDoubts]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (window.searchTimeout) clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => setSearchQuery(val), 400);
  };

  const filterButtons = [
    { key: 'all', label: 'Recent', icon: <Clock size={14} /> },
    { key: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
    { key: 'unanswered', label: 'Unanswered', icon: <Filter size={14} /> },
    ...(userSubjects.length > 0 ? [{ key: 'my-subjects', label: 'My Subjects', icon: <BookOpen size={14} /> }] : []),
    ...(userProfile?.branch ? [{ key: 'my-branch', label: 'My Branch', icon: <Sparkles size={14} /> }] : []),
    ...(userProfile?.semester ? [{ key: 'my-semester', label: `Sem ${userProfile.semester}`, icon: <Target size={14} /> }] : []),
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* 🔮 Hero Area */}
      <div className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest mb-10 shadow-lg">
            <Sparkles size={14} /> Community Intelligence
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-7xl lg:text-9xl font-black tracking-tighter text-white m-0 leading-[0.9]">
            The Feed
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-500 text-xl font-medium max-w-2xl mx-auto mt-8">
            Decentralized knowledge sharing. Solve challenges, earn respect, and accelerate your learning trajectory.
          </motion.p>
        </div>
      </div>

      {/* 🧭 Filter & Search Bar */}
      <div className="sticky top-20 z-40 px-6 mb-12">
        <div className="max-w-7xl mx-auto sb-glass !rounded-[32px] p-4 flex flex-col lg:flex-row items-center gap-6 shadow-premium">
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto">
              {filterButtons.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0 ${
                    filterType === key ? 'bg-violet-600 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
           </div>

           <div className="relative flex-1 group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-violet-400 transition-colors" size={20} />
              <input 
                value={searchInput}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Synchronize with the knowledge base..."
                className="sb-input !rounded-2xl pl-14 h-14 !bg-black"
              />
           </div>

           <Link href="/doubts/ask" className="sb-btn sb-btn-primary h-14 px-10 shadow-premium active:scale-95 transition-all">
             Ask Community
           </Link>
        </div>
      </div>

      {/* 📜 The Feed Content */}
      <div className="max-w-7xl mx-auto px-6 pb-40">
        {loading ? (
          <div className="sb-grid sb-grid-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="sb-skeleton h-80 rounded-[40px]" />)}
          </div>
        ) : error ? (
          <div className="py-20"><ErrorState message={error} onRetry={() => loadDoubts(true)} /></div>
        ) : doubts.length > 0 ? (
          <motion.div variants={containerVars} initial="hidden" animate="visible" className="sb-grid sb-grid-3">
            <AnimatePresence mode="popLayout">
              {doubts.map((doubt) => (
                <motion.div key={doubt.id} variants={itemVars} layout>
                  <Link href={`/doubts/${doubt.id}`} className="sb-card !p-0 h-full flex flex-col group relative overflow-hidden shadow-premium">
                    <div className="p-8 pb-0">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-4 py-1.5 rounded-xl bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest border border-violet-500/20">
                            {doubt.subjects?.name || 'General'}
                          </span>
                          {doubt.branch && (
                            <span className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-white/5">
                              {doubt.branch}
                            </span>
                          )}
                          {doubt.semester && (
                            <span className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-white/5">
                              Sem {doubt.semester}
                            </span>
                          )}
                        </div>
                        {doubt.status === 'resolved' && <CheckCircle2 size={16} className="text-emerald-500" />}
                      </div>

                      <h3 className="text-2xl font-black tracking-tight leading-tight mb-4 group-hover:text-violet-400 transition-colors">
                        {doubt.title}
                      </h3>
                      <p className="text-gray-500 text-sm font-medium line-clamp-3 mb-8">
                        {doubt.content_markdown || doubt.content_text || 'Conceptual synapse loading...'}
                      </p>
                    </div>

                    <div className="mt-auto p-8 border-t border-white/5 bg-white/2 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg overflow-hidden">
                             {doubt.profiles?.avatar_url ? (
                               <img src={doubt.profiles.avatar_url} className="w-full h-full object-cover" />
                             ) : (doubt.profiles?.username?.substring(0, 2).toUpperCase() || 'US')}
                          </div>
                          <div>
                            <p className="text-xs font-black m-0 uppercase tracking-tighter text-white">{doubt.profiles?.username || 'Learner'}</p>
                            <p className="text-[10px] m-0 text-gray-600 font-black uppercase tracking-tighter opacity-70">{new Date(doubt.created_at).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-gray-800 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <EmptyState 
            icon={MsgIcon}
            title="Silence in the Network"
            description="Our neural feed is currently tranquil. Be the first to disrupt the silence with a high-bandwidth inquiry."
            actionText="Ask First Doubt"
            actionHref="/doubts/ask"
          />
        )}
      </div>
    </div>
  );
}
