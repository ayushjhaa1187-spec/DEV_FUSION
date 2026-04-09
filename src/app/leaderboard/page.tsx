'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ReputationBadge from '@/components/user/ReputationBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Award, TrendingUp, Calendar, MapPin } from 'lucide-react';

const TIERS = [
  { name: 'Diamond', min: 1000, color: '#00f2ff', icon: '💎' },
  { name: 'Platinum', min: 500, color: '#e5e4e2', icon: '💍' },
  { name: 'Gold', min: 250, color: '#ffd700', icon: '🥇' },
  { name: 'Silver', min: 100, color: '#c0c0c0', icon: '🥈' },
  { name: 'Bronze', min: 0, color: '#cd7f32', icon: '🥉' },
];

const BRANCHES = ['All Branches', 'CSE', 'ECE', 'ME', 'CE', 'EE', 'IT'];

const getTier = (points: number) => {
  return TIERS.find(t => points >= t.min) || TIERS[TIERS.length - 1];
};

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [branch, setBranch] = useState('All Branches');

  useEffect(() => {
    async function loadLeaders() {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          timeframe,
          branch: branch === 'All Branches' ? 'all' : branch
        });
        const res = await fetch(`/api/leaderboard?${query}`);
        const data = await res.json();
        setLeaders(data || []);
      } catch (err) {
        console.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    loadLeaders();
  }, [timeframe, branch]);

  return (
    <main className="sb-page bg-[#0f0f1a] min-h-screen text-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
              <Award className="w-10 h-10" />
            </div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-white via-indigo-200 to-indigo-500 bg-clip-text text-transparent"
          >
            SkillBridge Champions
          </motion.h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Honoring the top minds who bridge the gap between concept and creation through community contribution.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="flex-1 flex gap-2 p-1.5 bg-[#1e1e2e] border border-gray-800 rounded-2xl overflow-hidden">
            {['all', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all capitalize ${timeframe === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 bg-[#1e1e2e] border border-gray-800 rounded-2xl px-4 py-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-transparent border-none text-sm font-medium outline-none text-white cursor-pointer"
            >
              {BRANCHES.map(b => <option key={b} value={b} className="bg-[#1e1e2e]">{b}</option>)}
            </select>
          </div>
        </div>

        {/* Podium for Top 3 */}
        {!loading && leaders.length >= 3 && timeframe === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-end">
            {/* 2nd Place */}
            <PodiumCard leader={leaders[1]} rank={2} timeframe={timeframe} />
            {/* 1st Place */}
            <PodiumCard leader={leaders[0]} rank={1} timeframe={timeframe} isMain />
            {/* 3rd Place */}
            <PodiumCard leader={leaders[2]} rank={3} timeframe={timeframe} />
          </div>
        )}

        {/* List */}
        <div className="bg-[#1e1e2e] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="hidden md:grid grid-cols-12 px-8 py-5 bg-[#161623] border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Student</div>
            <div className="col-span-2 text-center">Tier</div>
            <div className="col-span-2 text-center">Branch</div>
            <div className="col-span-2 text-right">Reputation</div>
          </div>

          <div className="divide-y divide-gray-800">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="px-8 py-6 animate-pulse bg-white/5 h-20"></div>
              ))
            ) : leaders.length > 0 ? (
              leaders.map((student: any, i: number) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  key={student.id}
                >
                  <Link 
                    href={`/profile/${student.username}`}
                    className="grid grid-cols-12 px-8 py-6 items-center hover:bg-white/5 transition-all group no-underline"
                  >
                    <div className="col-span-1 text-2xl font-black text-gray-700 group-hover:text-indigo-500 transition-colors">
                      {i + 1}
                    </div>
                    
                    <div className="col-span-11 md:col-span-5 flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`} 
                          alt="" 
                          className="w-12 h-12 rounded-full border-2 border-gray-800 group-hover:border-indigo-500 transition-colors" 
                        />
                        {student.login_streak >= 7 && (
                          <span className="absolute -top-1 -right-1 text-sm">🔥</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-indigo-400 text-lg transition-colors">{student.username}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {student.college || 'Anonymous Campus'}
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex col-span-2 justify-center">
                      <div 
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
                        style={{ 
                          borderColor: `${getTier(student.reputation_points).color}40`, 
                          color: getTier(student.reputation_points).color,
                          backgroundColor: `${getTier(student.reputation_points).color}10`
                        }}
                      >
                        {getTier(student.reputation_points).icon} {getTier(student.reputation_points).name}
                      </div>
                    </div>

                    <div className="hidden md:block col-span-2 text-center text-sm font-medium text-gray-400">
                      {student.branch || 'General'}
                    </div>

                    <div className="col-span-12 md:col-span-2 text-right">
                      <div className="text-xl font-black text-white">
                        {timeframe === 'all' ? student.reputation_points : student.period_points}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                        Points this {timeframe}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="py-32">
                <EmptyState icon="❄️" title="Silence on the boards" description="Nobody has earned reputation in this category yet." />
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function PodiumCard({ leader, rank, timeframe, isMain = false }: { leader: any, rank: number, timeframe: string, isMain?: boolean }) {
  const tier = getTier(leader.reputation_points);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`relative flex flex-col items-center p-6 md:p-8 rounded-[40px] border transition-all ${isMain ? 'bg-indigo-600/10 border-indigo-500/50 md:scale-110 z-10 my-4 md:my-0' : 'bg-[#1e1e2e] border-gray-800 scale-95'}`}
    >
      <div className={`absolute top-0 -mt-6 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-lg md:text-xl shadow-2xl ${rank === 1 ? 'bg-yellow-500 text-black' : rank === 2 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'}`}>
        {rank}
      </div>
      
      <img 
        src={leader.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.username}`} 
        className={`rounded-full border-4 mb-4 md:mb-6 shadow-2xl ${isMain ? 'w-20 h-20 md:w-24 md:h-24 border-indigo-500' : 'w-16 h-16 md:w-20 md:h-20 border-gray-700'}`}
        alt="" 
      />
      
      <h3 className="text-lg md:text-xl font-black mb-1">{leader.username}</h3>
      <p className="text-[10px] md:text-xs text-indigo-400 font-bold mb-3 md:mb-4 uppercase tracking-widest">{tier.name} Tier</p>
      
      <div className="flex items-center gap-2">
        <TrendingUp className="w-3 md:w-4 h-3 md:h-4 text-emerald-500" />
        <span className="text-xl md:text-2xl font-black">{timeframe === 'all' ? leader.reputation_points : leader.period_points}</span>
      </div>
    </motion.div>
  );
}
