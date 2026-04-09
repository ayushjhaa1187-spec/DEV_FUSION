'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Users, MessageSquare, Video, Star, BarChart3, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingPage } from '@/components/ui/Loading';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/analytics');
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <LoadingPage text="Loading Command Center..." />;
  if (error) return <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center text-red-500">{error}</div>;

  const cardStats = [
    { label: 'Total Learners', value: data.stats.users, icon: Users, color: '#6366f1' },
    { label: 'Doubts Resolved', value: data.stats.doubts, icon: MessageSquare, color: '#8b5cf6' },
    { label: 'Live Sessions', value: data.stats.sessions, icon: Video, color: '#10b981' },
    { label: 'Avg Rating', value: '4.9', icon: Star, color: '#f59e0b' },
  ];

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Admin Control</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Platform Analytics</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-lg font-mono">{new Date().toLocaleTimeString()}</p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cardStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#1e1e2e] border border-gray-800 p-6 rounded-3xl relative overflow-hidden group"
            >
              <div 
                className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: stat.color }}
              />
              <stat.icon className="w-8 h-8 mb-4" style={{ color: stat.color }} />
              <div className="text-4xl font-black mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Popular Subjects */}
          <div className="lg:col-span-2 bg-[#1e1e2e] border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <BarChart3 className="w-6 h-6 text-indigo-500" />
              <h2 className="text-2xl font-bold">In-Demand Subjects</h2>
            </div>
            
            <div className="space-y-6">
              {data.popularSubjects.map((sub: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-bold text-gray-500 truncate">{sub.subject_name || 'General'}</div>
                  <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((sub.trending_score || 10) * 5, 100)}%` }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                  <div className="text-sm font-mono text-gray-400">{(sub.trending_score || 0).toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Mentors */}
          <div className="bg-[#1e1e2e] border border-gray-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-8">Top Performing Mentors</h2>
            <div className="space-y-6">
              {data.topMentors.map((mentor: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                  <img src={mentor.profiles.avatar_url || `https://ui-avatars.com/api/?name=${mentor.profiles.username}`} className="w-12 h-12 rounded-full border-2 border-gray-800" alt="" />
                  <div className="flex-1">
                    <div className="font-bold">{mentor.profiles.username}</div>
                    <div className="text-xs text-gray-500">{mentor.specialty}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-indigo-400 font-black">{mentor.sessions_completed}</div>
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Sessions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
