'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { FileText, Download, Play, Search, BookOpen, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafeRealtime } from '@/hooks/useSafeRealtime';

const curatedPlaylists = [
  { 
    id: 'PL2_aWCzGMAwL39_RPP6LDPt90i0NTPu0z', 
    title: 'Data Structures Masterclass', 
    channel: 'MyCodeSchool',
    color: '#ef4444',
    description: 'Master data structures and algorithms from scratch to expert levels.', 
    image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop', 
    category: 'Prep Guide' 
  },
  { 
    id: 'PLBlnK6fEyqRiVhbXD97N78E7K4S2a89m-', 
    title: 'Operating Systems Essentials', 
    channel: 'Gate Smashers',
    color: '#3b82f6',
    description: 'Deep dive into process management, memory, and file systems.', 
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=250&fit=crop', 
    category: 'Core Knowledge' 
  },
  { 
    id: 'PLxCzCOWd7aiFAN6I8KuIsVinmlyscF7-X', 
    title: 'Advanced DBMS Guide', 
    channel: 'Knowledge Gate',
    color: '#a855f7',
    description: 'Master SQL, NoSQL, and database design patterns.', 
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=250&fit=crop', 
    category: 'SQL & NoSQL' 
  },
  { 
    id: 'PL4cUxeGkcL9g9gP2onazU5iF0xYnlsYpx', 
    title: 'Modern Web Engineering', 
    channel: 'Net Ninja',
    color: '#f59e0b',
    description: 'Full-stack engineering with React, Next.js, and Supabase.', 
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop', 
    category: 'Full Stack' 
  }
];

export default function ResourcesPageClient() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'videos'>('notes');
  const supabase = createSupabaseBrowser();
  
  const PAGE_SIZE = 12;

  const loadResources = async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('resources')
        .select('*, profiles(username), subjects(name)')
        .order('created_at', { ascending: false })
        .range(from, to);

      // Simple type filtering based on tab
      if (activeTab === 'notes') {
        query = query.eq('resource_type', 'note');
      } else {
        query = query.eq('resource_type', 'video');
      }

      const { data, error } = await query;
      
      if (error) throw error;

      if (isLoadMore) {
        setResources(prev => [...prev, ...(data || [])]);
      } else {
        setResources(data || []);
      }
      
      if ((data?.length || 0) < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(0);
    loadResources(false);
  }, [activeTab]);

  useEffect(() => {
    if (page > 0) {
      loadResources(true);
    }
  }, [page]);

  // Use Centralized Safe Realtime
  useSafeRealtime(
    'knowledge_hub_updates',
    {
      event: '*',
      schema: 'public',
      table: 'resources',
    },
    () => {
      setPage(0);
      loadResources(false);
    },
    []
  );

  const filteredResources = resources.filter(r => {
    const titleMatch = r.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const subjectMatch = r.subjects?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || subjectMatch;
  });

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      
      <div className="max-w-7xl mx-auto px-6 py-24">
        <header className="mb-16">
           <div className="flex items-center gap-2 text-indigo-500 mb-4">
              <BookOpen className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Academic Ecosystem</span>
           </div>
           <h1 className="text-5xl md:text-6xl font-black font-heading tracking-tighter mb-6">Knowledge <span>Hub</span></h1>
           <p className="text-gray-500 max-w-2xl text-lg">
             Access industry-standard curated video lectures and peer-contributed study materials in one unified laboratory.
           </p>
        </header>

        {/* Search Bar */}
        <div className="relative mb-12">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
            <input 
              type="text"
              placeholder="Filter by title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#13132b] border border-white/5 py-6 pl-16 pr-8 rounded-[24px] outline-none focus:border-indigo-500/30 transition-all font-bold text-white placeholder:text-gray-700"
            />
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 p-2 bg-white/5 w-fit rounded-2xl border border-white/5 mb-12">
           <button 
             onClick={() => setActiveTab('notes')}
             className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'notes' ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-white'}`}
           >
             Study Materials
           </button>
           <button 
             onClick={() => setActiveTab('videos')}
             className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'videos' ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-white'}`}
           >
             Video Lectures
           </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#13132b] border border-white/5 p-8 rounded-[40px] h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
             {activeTab === 'notes' ? (
               <motion.div 
                 key="notes"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
               >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredResources.length > 0 ? filteredResources.map((res) => (
                       <div key={res.id} className="bg-[#13132b] border border-white/5 p-8 rounded-[40px] hover:border-indigo-500/20 transition-all group">
                          <div className="flex justify-between items-start mb-8">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                <FileText size={24} />
                             </div>
                             <a href={res.file_url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" download><Download size={20} /></a>
                          </div>
                          <h3 className="text-xl font-black mb-2 line-clamp-1">{res.title}</h3>
                          <p className="text-gray-500 text-sm mb-8 line-clamp-2 leading-relaxed">{res.description}</p>
                          <div className="flex items-center justify-between pt-6 border-t border-white/5">
                             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{res.subjects?.name}</span>
                             <span className="text-[10px] font-bold text-gray-700">@{res.profiles?.username}</span>
                          </div>
                       </div>
                     )) : (
                       <div className="col-span-full py-20 text-center text-gray-600">No study materials found.</div>
                     )}
                  </div>
               </motion.div>
             ) : (
               <motion.div 
                 key="videos"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-12"
               >
                  {/* Hardcoded Curated Playlists */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {curatedPlaylists.map((playlist) => (
                      <div key={playlist.id} className="bg-[#13132b] border border-white/5 rounded-[40px] overflow-hidden group hover:border-indigo-500/20 transition-all">
                         <div className="aspect-video relative overflow-hidden bg-black">
                            <iframe 
                              src={`https://www.youtube.com/embed/videoseries?list=${playlist.id}`}
                              className="w-full h-full border-none"
                              allowFullScreen
                            />
                         </div>
                         <div className="p-8 flex items-center justify-between">
                            <div>
                               <div className="flex items-center gap-2 mb-2">
                                  <Play size={16} fill={playlist.color} stroke={playlist.color} />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{playlist.channel}</span>
                               </div>
                               <h3 className="text-xl font-black font-heading tracking-tighter">{playlist.title}</h3>
                            </div>
                            <a 
                              href={`https://youtube.com/playlist?list=${playlist.id}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-indigo-600 transition-all group-hover:scale-110"
                            >
                               <ExternalLink size={20} />
                            </a>
                         </div>
                      </div>
                    ))}
                  </div>

                  {/* User Uploaded Videos */}
                  {filteredResources.length > 0 && (
                    <div className="pt-12 border-t border-white/5">
                      <h2 className="text-2xl font-black mb-12 uppercase tracking-tighter">Community <span>Transmissions</span></h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map((res) => (
                      <div key={res.id} className="bg-[#13132b] border border-white/5 p-8 rounded-[40px] hover:border-indigo-500/20 transition-all group overflow-hidden">
                         <div className="flex justify-between items-start mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                               <Play size={24} />
                            </div>
                            <div className="flex gap-2">
                               <a href={res.file_url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" download><Download size={20} /></a>
                               <a href={res.file_url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors"><ExternalLink size={20} /></a>
                            </div>
                         </div>
                         
                         {/* Video Preview/Player for Community Uploads */}
                         <div className="aspect-video mb-6 rounded-2xl bg-black overflow-hidden border border-white/5">
                            {res.file_url?.includes('youtube.com') || res.file_url?.includes('youtu.be') ? (
                               <iframe 
                                 src={res.file_url.replace('watch?v=', 'embed/')}
                                 className="w-full h-full border-none"
                                 allowFullScreen
                               />
                            ) : (
                               <video 
                                 src={res.file_url} 
                                 controls 
                                 className="w-full h-full object-cover"
                                 poster="/video-placeholder.png"
                               />
                            )}
                         </div>

                         <h3 className="text-xl font-black mb-2 line-clamp-1">{res.title}</h3>
                         <p className="text-gray-500 text-sm mb-8 line-clamp-2 leading-relaxed">{res.description}</p>
                         <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{res.subjects?.name}</span>
                            <span className="text-[10px] font-bold text-gray-700">@{res.profiles?.username}</span>
                         </div>
                      </div>
                        ))}
                      </div>
                    </div>
                  )}
               </motion.div>
             )}
          </AnimatePresence>
        )}

        {/* Load More Button */}
        {hasMore && !loading && resources.length > 0 && (
          <div className="mt-16 flex justify-center">
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={loadingMore}
              className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all disabled:opacity-50"
            >
              {loadingMore ? 'Syncing...' : 'Load More Intel'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

