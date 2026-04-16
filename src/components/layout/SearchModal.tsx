'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, MessageSquare, User, Book, Command, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.length < 2) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#06060f]/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-2xl bg-[#0c0c16] border border-white/10 rounded-[2.5rem] shadow-3xl overflow-hidden shadow-indigo-500/10"
      >
        <div className="flex items-center p-6 border-b border-white/5">
          <SearchIcon className="w-6 h-6 text-indigo-400 mr-4" />
          <input 
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doubts, mentors, or subjects..."
            className="flex-1 bg-transparent border-none outline-none text-xl text-white placeholder-gray-500 font-medium"
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] text-gray-500 font-bold">
              ESC
            </div>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {!results && !loading && query.length < 2 && (
            <div className="py-20 text-center">
              <Command className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-20" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Awaiting Input Signal</p>
              <div className="flex justify-center gap-4 mt-6">
                {['Linear Algebra', 'React Hooks', 'DBMS', 'Physics'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-gray-400 border border-white/5 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all font-black uppercase"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-8 pb-4">
              {/* Subjects Section */}
              {results.subjects?.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-4 mb-3">Academic Domains</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {results.subjects.map((s: any) => (
                      <Link 
                        key={s.id} 
                        href={`/doubts?subject=${s.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                          <Book size={18} />
                        </div>
                        <span className="font-bold text-gray-300 group-hover:text-white">{s.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentors Section */}
              {results.mentors?.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-4 mb-3">Expert Nodes</h3>
                  <div className="space-y-1">
                    {results.mentors.map((m: any) => (
                      <Link 
                        key={m.id} 
                        href={`/u/${m.username}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-indigo-500/20 overflow-hidden ring-2 ring-transparent group-hover:ring-indigo-500/30 transition-all">
                              {m.avatar_url ? <img src={m.avatar_url} alt={m.full_name || m.username || 'Avatar'} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-black">{m.username?.[0].toUpperCase()}</div>}
                           </div>
                           <div>
                              <div className="font-bold text-gray-300 group-hover:text-white">{m.full_name}</div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">@{m.username} • {m.role}</div>
                           </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Doubts Section */}
              {results.doubts?.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-4 mb-3">Active Transmissions</h3>
                  <div className="space-y-1">
                    {results.doubts.map((d: any) => (
                      <Link 
                        key={d.id} 
                        href={`/doubts/${d.id}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                              <MessageSquare size={18} />
                           </div>
                           <div>
                              <div className="font-bold text-gray-300 group-hover:text-white line-clamp-1">{d.title}</div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                                 {d.status} • {d.votes} votes • {d.profiles?.full_name}
                              </div>
                           </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.doubts?.length === 0 && results.mentors?.length === 0 && results.subjects?.length === 0 && (
                <div className="py-20 text-center opacity-30 font-black uppercase text-xs tracking-[0.2em]">
                   No matches found in database
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest">
           <div className="flex gap-4">
              <span className="flex items-center gap-1"><Command size={10} /> + K to search</span>
              <span className="flex items-center gap-1">ESC to close</span>
           </div>
           <div className="text-indigo-500/50">SkillBridge Neural Search v2.0</div>
        </div>
      </motion.div>
    </div>
  );
}
