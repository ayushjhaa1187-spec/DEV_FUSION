'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { 
  Users, 
  CreditCard, 
  Zap, 
  TrendingUp, 
  UserPlus, 
  MoreVertical, 
  Mail,
  ShieldCheck,
  Search,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function OrgDashboardClient() {
  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function fetchOrgData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch org where user is admin
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('admin_id', user.id)
        .maybeSingle();

      if (orgData) {
        setOrg(orgData);
        // Fetch members
        const { data: memberData } = await supabase
          .from('campus_members')
          .select('*, profiles(username, full_name, avatar_url, reputation_points)')
          .eq('org_id', orgData.id);
        setMembers(memberData || []);
      }
      setLoading(false);
    }
    fetchOrgData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !org) return;
    setIsInviting(true);
    // In a real app, this would call an API to send an email
    // For now, we simulate success
    setTimeout(() => {
      setInviteEmail('');
      setIsInviting(false);
      alert(`Invitation sent to ${inviteEmail}`);
    }, 1000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center p-6 text-white animate-pulse">
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto mb-4" />
        <div className="h-6 bg-white/5 rounded-xl w-48" />
      </div>
    </div>
  );

  if (!org) return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-8">
        <ShieldCheck size={40} className="text-indigo-400" />
      </div>
      <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter italic">Enterprise Workspace</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-10 leading-relaxed font-medium">
        You are not currently managing an organization. Contact business support to set up your campus portal.
      </p>
      <button 
        onClick={() => window.location.href = '/'}
        className="px-10 py-4 bg-white/5 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white border border-white/5 hover:border-white/10 transition-all"
      >
        Return to Safety
      </button>
    </div>
  );

  const mockData = [
    { name: 'Mon', usage: 45 },
    { name: 'Tue', usage: 52 },
    { name: 'Wed', usage: 38 },
    { name: 'Thu', usage: 65 },
    { name: 'Fri', usage: 48 },
    { name: 'Sat', usage: 25 },
    { name: 'Sun', usage: 18 },
  ];

  return (
    <main className="min-h-screen bg-[#050510] text-white selection:bg-indigo-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-[2px] text-indigo-400">
                {org.plan.replace('_', ' ')}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-5xl font-black font-heading tracking-tight leading-[0.9]">
              {org.name} <span className="text-gray-500 underline decoration-indigo-500/30">Portal</span>
            </h1>
            <p className="text-gray-500 font-medium max-w-lg text-lg">
              Empowering your campus with decentralized academic intelligence and mentor-led growth.
            </p>
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-white/10 rounded-xl transition-all shadow-xl shadow-black/20">Overview</button>
            <button className="px-6 py-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">Settings</button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Enrolled Students', val: members.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Campus Credits', val: '12,450', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'AI Solves (MTD)', val: '842', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { label: 'Avg Reputation', val: '412', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-[#0f0f23] p-8 rounded-[40px] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-3xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} />
                </div>
                <ArrowUpRight size={20} className="text-gray-700 group-hover:text-white transition-colors" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">{stat.label}</span>
                <span className="text-3xl font-black">{stat.val}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#0f0f23] p-10 rounded-[48px] border border-white/5">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black uppercase tracking-tight italic">Knowledge Consumption</h3>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" /> Solves
                  </span>
                </div>
              </div>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <Bar dataKey="usage" radius={[12, 12, 4, 4]}>
                      {mockData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 3 ? '#10b981' : 'url(#barGradient)'} />
                      ))}
                    </Bar>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 800 }} 
                      dy={10}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{ 
                        background: '#0d0d1a', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        padding: '12px'
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student Management */}
            <div className="bg-[#0f0f23] p-10 rounded-[48px] border border-white/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tight italic">Student Roster</h3>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input 
                    placeholder="Search members..." 
                    className="bg-white/5 border border-white/5 rounded-2xl py-2 pl-12 pr-4 text-xs font-bold outline-none focus:border-indigo-500/30 transition-all w-64"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {members.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl text-gray-600 text-sm font-bold uppercase tracking-widest">
                    No students currently enrolled
                  </div>
                ) : (
                  members.map((m, idx) => (
                    <div key={m.id} className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <img 
                          src={m.profiles.avatar_url || `https://ui-avatars.com/api/?name=${m.profiles.username}`} 
                          className="w-12 h-12 rounded-2xl object-cover border border-white/10" 
                          alt="" 
                        />
                        <div>
                          <p className="font-black text-sm tracking-tight">{m.profiles.full_name || m.profiles.username}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-0.5">@{m.profiles.username} • {m.profiles.reputation_points} Rep</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right mr-4 hidden md:block">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Joined</p>
                          <p className="text-xs font-bold">{new Date(m.joined_at).toLocaleDateString()}</p>
                        </div>
                        <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                          <MoreVertical size={16} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Quick Invite Card */}
            <div className="bg-indigo-600 p-8 rounded-[48px] shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 text-white/10 group-hover:scale-125 transition-transform duration-700">
                <UserPlus size={120} />
              </div>
              <div className="relative">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Mail size={24} />
                </div>
                <h3 className="text-2xl font-black mb-2 leading-tight tracking-tight">Expand the<br />Network</h3>
                <p className="text-indigo-100 text-sm font-medium mb-8 opacity-80">Invite students and faculty to join your private campus workspace.</p>
                
                <form onSubmit={handleInvite} className="space-y-4">
                  <input 
                    type="email" 
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    className="w-100 w-full p-4 bg-white/20 backdrop-blur-md rounded-2xl outline-none border border-white/10 placeholder:text-white/40 text-sm font-bold"
                  />
                  <button 
                    disabled={isInviting}
                    className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {isInviting ? 'Sending...' : 'Issue Invitation'}
                  </button>
                </form>
              </div>
            </div>

            {/* Plan Status */}
            <div className="bg-[#0f0f23] p-10 rounded-[48px] border border-white/5">
              <h3 className="text-xl font-black uppercase tracking-tight italic mb-8">System Status</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Infrastructure</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase">Operational</span>
                </div>
                
                <div className="p-4 bg-white/5 rounded-3xl space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                    <span className="text-gray-500">Storage Usage</span>
                    <span>42%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[42%] bg-indigo-500 rounded-full" />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
                    View Cloud logs <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
