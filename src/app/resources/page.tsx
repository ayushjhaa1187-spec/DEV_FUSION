'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { FileText, Download, Plus, Search, Filter, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function loadResources() {
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
    }
    loadResources();
  }, [supabase]);

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.subjects?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || r.file_type === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Knowledge Hub</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Resource Sharing</h1>
            <p className="text-gray-400 mt-2 max-w-xl">
              Access high-quality study materials, cheat sheets, and handwritten notes shared by top contributors.
            </p>
          </div>
          
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/10">
              <Plus className="w-5 h-5" />
              Upload Resource
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text"
              placeholder="Search by topic or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#1e1e2e] border border-gray-800 rounded-2xl outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div className="flex gap-2 p-1.5 bg-[#1e1e2e] border border-gray-800 rounded-2xl">
            {['All', 'PDF', 'Notes', 'Cheat-Sheet'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedType === type ? 'bg-indigo-600' : 'text-gray-500 hover:text-white'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-3xl" />)}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={res.id}
                className="group bg-[#1e1e2e] border border-gray-800 p-8 rounded-[32px] hover:border-indigo-500/30 transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
                    {res.file_type}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">{res.title}</h3>
                <p className="text-gray-500 text-sm mb-6 line-clamp-2">{res.description || 'No description provided.'}</p>
                
                <div className="mt-auto pt-6 border-t border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-indigo-500 uppercase tracking-tighter mb-1">{res.subjects?.name || 'General'}</div>
                    <div className="text-xs text-gray-600">by @{res.profiles?.username}</div>
                  </div>
                  <a 
                    href={res.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-gray-800 hover:bg-indigo-600 rounded-xl transition-all"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-8">
              <BookOpen className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">No resources yet — be the first to share!</h3>
            <p className="max-w-md mx-auto text-sm text-gray-400">
              Contribute to the collective knowledge of SkillBridge. Upload your notes or cheat sheets to help others grow.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
