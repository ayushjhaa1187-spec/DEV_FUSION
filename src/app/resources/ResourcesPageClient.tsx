'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { FileText, Download, Play, Search, BookOpen, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafeRealtime } from '@/hooks/useSafeRealtime';

export default function ResourcesPageClient() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'videos'>('notes');
  const supabase = createSupabaseBrowser();

  const loadResources = async () => {
    try {
      const { data } = await supabase
        .from('resources')
        .select('*, profiles(username), subjects(name)')
        .order('created_at', { ascending: false });
      setResources(data || []);
    } catch (err) {
      console.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [supabase]);

  // Use Centralized Safe Realtime
  useSafeRealtime(
    'knowledge_hub_updates',
    {
      event: '*',
      schema: 'public',
      table: 'resources',
    },
    () => {
      loadResources();
    },
    []
  );

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.subjects?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <AnimatePresence mode="wait">
           {activeTab === 'notes' ? (
             <motion.div 
               key="notes"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
             >
                <div className="relative mb-12">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
                   <input 
                     type="text"
                     placeholder="Search documentation, cheat sheets, or notes..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-[#13132b] border border-white/5 py-6 pl-16 pr-8 rounded-[24px] outline-none focus:border-indigo-500/30 transition-all font-bold text-white placeholder:text-gray-700"
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {loading ? (
                     Array.from({ length: 6 }).map((_, i) => (
                       <div key={i} className="bg-[#13132b] border border-white/5 p-8 rounded-[40px] h-64 animate-pulse" />
                     ))
                   ) : filteredResources.length > 0 ? filteredResources.map((res) => (
                     <div key={res.id} className="bg-[#13132b] border border-white/5 p-8 rounded-[40px] hover:border-indigo-500/20 transition-all group">
                        <div className="flex justify-between items-start mb-8">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                              <FileText size={24} />
                           </div>
                           <a href={res.file_url} className="text-gray-500 hover:text-white transition-colors" download><Download size={20} /></a>
                        </div>
                        <h3 className="text-xl font-black mb-2 line-clamp-1">{res.title}</h3>
                        <p className="text-gray-500 text-sm mb-8 line-clamp-2 leading-relaxed">{res.description}</p>
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                           <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{res.subjects?.name}</span>
                           <span className="text-[10px] font-bold text-gray-700">@{res.profiles?.username}</span>
                        </div>
                     </div>
                   )) : (
                     <div className="col-span-full py-20 text-center text-gray-600">No resources found matching your search.</div>
                   )}
                </div>
             </motion.div>
           ) : (
             <motion.div 
               key="videos"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="grid grid-cols-1 md:grid-cols-2 gap-8"
             >
                {curatedPlaylists.map((playlist) => (
                  <div key={playlist.id} className="bg-[#13132b] border border-white/5 rounded-[40px] overflow-hidden group hover:border-indigo-500/20 transition-all">
                     <div className="aspect-video relative overflow-hidden">
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
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </main>
  );
}
