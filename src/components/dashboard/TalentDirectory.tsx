'use client';

import React, { useState, useEffect } from 'react';
import { Search, Trophy, Briefcase, GraduationCap, ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';

interface TalentProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  reputation_points: number;
  bio?: string;
  college?: string;
}

export const TalentDirectory = () => {
  const [talent, setTalent] = useState<TalentProfile[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTalent();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchTalent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/talent-directory?query=${query}`);
      const data = await res.json();
      setTalent(data);
    } catch (err) {
      console.error('Talent fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Briefcase className="text-amber-400" />
            Top Percentile Talent
          </h3>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
            Verified contributors with high cognitive inertia
          </p>
        </div>

        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-amber-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by skill, name, or university..."
            className="w-full bg-[#13132b] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-amber-400/50 outline-none transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white/5 rounded-[32px] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {talent.map((person) => (
            <div key={person.id} className="bg-[#13132b] p-6 rounded-[32px] border border-white/5 hover:border-amber-400/30 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                  <Trophy size={80} />
               </div>
               
               <div className="flex gap-4 relative z-10">
                  {person.avatar_url ? (
                    <Image src={person.avatar_url} alt={person.full_name} width={56} height={56} className="rounded-2xl border border-white/10" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xl font-black text-white">
                       {person.full_name[0]}
                    </div>
                  )}
                  
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-white tracking-tight uppercase">{person.full_name}</h4>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">@{person.username}</div>
                        </div>
                        <div className="flex flex-col items-end">
                           <div className="flex items-center gap-1 text-amber-400 text-sm font-black">
                              <Star size={12} fill="currentColor" />
                              {person.reputation_points}
                           </div>
                           <div className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">REP POINTS</div>
                        </div>
                     </div>
                     
                     <div className="mt-4 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold text-gray-400">
                           <GraduationCap size={12} />
                           {person.college || 'Autonomous Learner'}
                        </div>
                     </div>
                     
                     <p className="mt-4 text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
                        {person.bio || 'This student has authorized talent discovery but has not set a custom bio yet.'}
                     </p>
                     
                     <button className="mt-6 w-full py-2.5 bg-white/5 hover:bg-amber-400 hover:text-black rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn">
                        Commence Interview Loop <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                     </button>
                  </div>
               </div>
            </div>
          ))}
          
          {talent.length === 0 && (
            <div className="col-span-2 py-20 text-center">
               <div className="text-4xl mb-4 opacity-20">🕵️‍♂️</div>
               <h4 className="text-white font-bold">No High-Inertia Talent Found</h4>
               <p className="text-gray-500 text-sm mt-1">Try broadening your search parameters or check back later.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
