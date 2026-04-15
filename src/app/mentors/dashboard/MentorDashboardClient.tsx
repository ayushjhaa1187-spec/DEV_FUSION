'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import {
  DollarSign,
  Calendar,
  Star,
  Clock,
  ChevronRight,
  ExternalLink,
  Settings,
  Bell,
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MentorDashboardClient() {
  const [profile, setProfile] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function fetchMentorData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch mentor profile
      const { data: profileData } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);

        // 2. Fetch ledger
        const { data: ledgerData } = await supabase
          .from('commission_ledger')
          .select('*')
          .eq('mentor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setLedger(ledgerData || []);

        // 3. Fetch upcoming bookings
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*, profiles(full_name, avatar_url, username)')
          .eq('mentor_id', user.id)
          .eq('status', 'confirmed')
          .order('scheduled_at', { ascending: true })
          .limit(3);
        setBookings(bookingData || []);
      }
      setLoading(false);
    }
    fetchMentorData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white animate-pulse">
      <div className="h-2 w-64 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-indigo-500 rounded-full" />
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20">
        <Award size={48} className="text-indigo-400" />
      </div>
      <h2 className="text-3xl font-black mb-4 uppercase tracking-[4px]">Become a Mentor</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-10 leading-relaxed font-bold">
        Your application is either pending or you haven't applied yet. Join the elite network of developers and educators.
      </p>
      <button
        onClick={() => window.location.href = '/mentors/apply'}
        className="px-12 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all"
      >
        Launch Application
      </button>
    </div>
  );

  const stats = [
    { label: 'Total Earnings', val: '₹42,850', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Avg Rating', val: profile.rating || '5.0', icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Total Sessions', val: profile.total_sessions || '0', icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Avg Payout', val: '₹1,240', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  ];

  return (
    <main className="min-h-screen bg-[#050510] text-white overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
        {/* Top Navbar Simulation */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-lg opacity-20" />
              <img src={`https://ui-avatars.com/api/?name=${profile.specialty}`} className="relative w-14 h-14 rounded-2xl object-cover border-2 border-white/5" alt="" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{profile.specialty}</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Verified Expert</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition border border-white/5">
              <Bell size={20} className="text-gray-400" />
            </button>
            <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition border border-white/5">
              <Settings size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-20">
          <h1 className="text-6xl lg:text-8xl font-black font-heading tracking-tighter leading-[0.8] mb-6">
            Mentor <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Legacy</span>
          </h1>
          <p className="text-gray-500 max-w-xl text-lg font-bold">
            Influence the next generation of engineers while scaling your independent consulting practice.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0c0c1e] p-10 rounded-[48px] border border-white/5 relative group hover:scale-[1.02] transition-all"
            >
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-8 border border-white/5`}>
                <stat.icon size={24} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{stat.label}</p>
              <h4 className="text-4xl font-black">{stat.val}</h4>
              <ArrowUpRight className="absolute top-10 right-10 text-gray-800 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Recent Payouts */}
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-[#0c0c1e] p-12 rounded-[56px] border border-white/5">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Financial Ledger</h3>
                <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 border-b border-indigo-400/30">Detailed View</button>
              </div>

              <div className="space-y-4">
                {ledger.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl text-gray-600 font-bold uppercase tracking-widest text-xs">
                    No transactions recorded yet
                  </div>
                ) : (
                  ledger.map((entry, idx) => (
                    <div key={entry.id} className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-indigo-500/20 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center font-black">₹</div>
                        <div>
                          <p className="font-black tracking-tight text-lg">Payout #{entry.id.slice(0, 5)}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Gross: ₹{entry.gross_amount} • Fee: ₹{entry.platform_fee}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-emerald-400">+₹{entry.mentor_payout}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">{entry.settled ? 'Settled' : 'Processing'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Profile Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#0c0c1e] p-10 rounded-[48px] border border-white/5">
                <div className="flex items-center gap-4 mb-8">
                  <Clock className="text-indigo-400" />
                  <h4 className="text-lg font-black tracking-tight">Time Availability</h4>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</p>
                    <p className="text-sm font-bold text-white uppercase tracking-widest">Active & Booking</p>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-gray-500">Current Rate</span>
                    <span className="text-lg font-black">₹{profile.hourly_rate}/hr</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#0c0c1e] p-10 rounded-[48px] border border-white/5 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-black tracking-tight mb-2">Public Profile</h4>
                  <p className="text-gray-500 text-xs font-medium">Your profile is visible to all premium students.</p>
                </div>
                <button className="mt-8 p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-between group transition-all">
                  <span className="text-[10px] font-black uppercase tracking-widest">Profile URL</span>
                  <ExternalLink size={16} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Sessions Sidebar */}
          <div className="space-y-10">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[56px] shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 text-white/5 group-hover:scale-150 transition-transform duration-1000 rotate-12">
                <Calendar size={180} />
              </div>
              <div className="relative">
                <h3 className="text-2xl font-black mb-10 leading-none">Upcoming<br />Sessions</h3>

                <div className="space-y-6">
                  {bookings.length === 0 ? (
                    <div className="text-indigo-100/50 text-xs font-bold uppercase tracking-widest py-10">
                      Empty schedule today
                    </div>
                  ) : (
                    bookings.map((b, i) => (
                      <div key={b.id} className="p-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                        <div className="flex items-center gap-4 mb-4">
                          <img src={b.profiles.avatar_url || `https://ui-avatars.com/api/?name=${b.profiles.username}`} className="w-10 h-10 rounded-xl" alt="" />
                          <div>
                            <p className="text-xs font-black">{b.profiles.full_name || b.profiles.username}</p>
                            <p className="text-[10px] font-bold text-white/60">Topic: Competitive Programming</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <span className="text-[10px] font-black uppercase">{new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button className="w-full mt-10 py-5 bg-white text-indigo-600 rounded-[28px] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95">
                  View Full Schedule
                </button>
              </div>
            </div>

            {/* Reputation Progress */}
            <div className="bg-[#0c0c1e] p-10 rounded-[48px] border border-white/5">
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-8">Reputation Rank</h3>
              <div className="space-y-8">
                <div className="flex justify-center flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center relative">
                    <span className="text-2xl font-black">8.4</span>
                    <div className="absolute -bottom-2 px-3 py-1 bg-indigo-500 rounded-full text-[8px] font-black uppercase">Platinum</div>
                  </div>
                </div>
                <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-500 leading-relaxed px-4">
                  Maintain a 4.8+ rating to unlock Elite commission bonuses next month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
