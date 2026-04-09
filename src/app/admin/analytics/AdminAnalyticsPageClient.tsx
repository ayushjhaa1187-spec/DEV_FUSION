'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Users, MessageSquare, Video, Star, BarChart3, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingPage } from '@/components/ui/Loading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminAnalyticsPageClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleResolveReport = async (doubtId: string) => {
    setData((prev: any) => ({
      ...prev,
      reportedContent: prev.reportedContent.filter((d: any) => d.id !== doubtId)
    }));
  };

  if (loading) return <LoadingPage text="Securing Command Center..." />;
  if (error) return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Access Denied</h2>
      <p className="text-red-400 font-bold mb-8">{error}</p>
      <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-white/5 text-gray-400 rounded-xl font-black uppercase tracking-widest text-xs hover:text-white transition">Go Back</button>
    </div>
  );

  const cardStats = [
    { label: 'Total Learners', value: data.stats.users, icon: Users, color: '#6366f1' },
    { label: 'Doubts Resolved', value: data.stats.doubts, icon: MessageSquare, color: '#8b5cf6' },
    { label: 'Live Sessions', value: data.stats.sessions, icon: Video, color: '#10b981' },
    { label: 'Avg Rating', value: '4.9', icon: Star, color: '#f59e0b' },
  ];

  const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-24">
        <header className="mb-16">
          <div className="flex items-center gap-2 text-indigo-500 mb-4">
            <ShieldCheck className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Platform Authority Console</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-heading tracking-tighter">Ecosystem <span>Analytics</span></h1>
        </header>

        {/* Real-time Ticker Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
          {cardStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#13132b] border border-white/5 p-8 rounded-[32px] group hover:border-indigo-500/30 transition-all shadow-2xl relative overflow-hidden"
            >
              <stat.icon className="w-6 h-6 mb-6 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: stat.color }} />
              <div className="text-5xl font-black mb-2 font-heading tracking-tighter tabular-nums">{stat.value}</div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-20">
          {/* Test Performance Chart */}
          <div className="xl:col-span-2 bg-[#13132b] border border-white/5 rounded-[40px] p-10">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-2xl font-black font-heading mb-1">Knowledge Accuracy</h2>
                <p className="text-sm text-gray-500">Average test scores across academic verticals</p>
              </div>
              <BarChart3 className="w-6 h-6 text-indigo-500 opacity-50" />
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.testPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  />
                  <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                    {data.testPerformance.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Mentors Sidebar */}
          <div className="bg-gradient-to-b from-[#13132b] to-black border border-white/5 rounded-[40px] p-10">
            <h2 className="text-2xl font-black font-heading mb-10">Top Performers</h2>
            <div className="space-y-8">
              {data.topMentors.map((mentor: any, i: number) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="relative">
                     <img src={mentor.profiles.avatar_url || `https://ui-avatars.com/api/?name=${mentor.profiles.username}`} className="w-14 h-14 rounded-2xl grayscale group-hover:grayscale-0 transition-all border-2 border-white/5 object-cover" alt="" />
                     <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black border-2 border-[#13132b]">#{i+1}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-sm tracking-tight">{mentor.profiles.username}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{mentor.specialty}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-indigo-400 font-black font-heading">{mentor.sessions_completed}</div>
                    <div className="text-[9px] uppercase text-gray-500 font-bold">Res.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Moderation Queue */}
        <section className="bg-[#13132b] border border-white/5 rounded-[40px] p-10">
          <div className="flex items-center gap-3 mb-10">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-black font-heading">Moderation Queue</h2>
            <span className="ml-auto bg-red-500/10 text-red-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
              {data.reportedContent.length} Flagged
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {data.reportedContent.length > 0 ? data.reportedContent.map((item: any) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-black/40 border border-white/5 p-6 rounded-[24px] hover:border-red-500/20 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-black">
                      {item.profiles?.username?.[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-400">Flagged Doubts</div>
                      <div className="text-[10px] text-gray-600 font-bold">{new Date(item.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm mb-4 line-clamp-2">{item.title}</h4>
                  <div className="flex gap-2">
                     <button onClick={() => handleResolveReport(item.id)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Ignore</button>
                     <button className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Remove</button>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center bg-white/5 rounded-[32px] border border-dashed border-white/10">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold">Sanitized Environment</h3>
                  <p className="text-sm text-gray-500">No active reports. Community is healthy.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
