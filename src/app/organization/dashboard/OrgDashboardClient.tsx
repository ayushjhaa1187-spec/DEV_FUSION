'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  Video, 
  Search, 
  MapPin, 
  ShieldCheck, 
  TrendingUp,
  LayoutDashboard,
  UserPlus,
  Calendar,
  Settings,
  ChevronRight,
  Filter,
  LineChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

interface OrgDashboardProps {
  org: any;
  stats: {
    mentors: number;
    interviews: number;
    talentPool: number;
  };
  subjects: any[];
}

export default function OrgDashboardClient({ org, stats, subjects }: OrgDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [talent, setTalent] = useState<any[]>([]);
  const [loadingTalent, setLoadingTalent] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const supabase = createSupabaseBrowser();
  const { showToast } = useToast();

  const isVerified = org.is_verified;

  useEffect(() => {
    if (activeTab === 'recruitment' && isVerified) {
      fetchTalent();
    }
  }, [activeTab, subjectFilter]);

  const fetchTalent = async () => {
    setLoadingTalent(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          avatar_url, 
          reputation_points, 
          college, 
          bio,
          recruitment_opt_in
        `)
        .eq('recruitment_opt_in', true)
        .order('reputation_points', { ascending: false })
        .limit(20);

      const { data, error } = await query;
      if (error) throw error;
      setTalent(data || []);
    } catch (err: any) {
      showToast('Failed to fetch talent pool', 'error');
    } finally {
      setLoadingTalent(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'recruitment', label: 'Talent Discovery', icon: UserPlus },
    { id: 'interviews', label: 'Interviews', icon: Calendar },
    { id: 'analytics', label: 'Institutional Radar', icon: LineChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
           <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <Building2 className="w-6 h-6 text-emerald-400" />
           </div>
           <div>
              <p className="font-bold text-sm tracking-tight truncate w-32">{org.name}</p>
              <div className="flex items-center gap-1">
                 <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-gray-500'}`}></span>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest">{isVerified ? 'Verified' : 'Pending Verification'}</p>
              </div>
           </div>
        </div>

        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Institutional Overview</h2>
                  <p className="text-gray-500">Managing {org.name}'s talent pipeline and institutional credibility.</p>
                </div>
                {!isVerified && (
                  <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6">
                    Complete Verification
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: 'Affiliated Mentors', value: stats.mentors, icon: Users, color: 'text-blue-400' },
                   { label: 'Scheduled Interviews', value: stats.interviews, icon: Video, color: 'text-purple-400' },
                   { label: 'Verified Hires', value: 0, icon: ShieldCheck, color: 'text-emerald-400' },
                 ].map((stat, i) => (
                   <Card key={i} className="bg-white/5 border-white/5 p-6 hover:border-emerald-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                         <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                         </div>
                         <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-4xl font-black mt-1">{stat.value}</h3>
                   </Card>
                 ))}
              </div>

              <Card className="bg-white/5 border-white/5 overflow-hidden">
                 <CardHeader className="border-b border-white/5 p-6">
                    <CardTitle className="text-lg">Recent Institutional Activity</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="p-12 text-center">
                       <p className="text-gray-500 text-sm">No recent activity found. Start recruiting to see updates here.</p>
                    </div>
                 </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'recruitment' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
               <div>
                  <h2 className="text-3xl font-black tracking-tight">Talent Discovery</h2>
                  <p className="text-gray-500">Identify top-performing students for recruitment and internal projects.</p>
               </div>

               {!isVerified ? (
                 <Card className="bg-emerald-500/5 border-emerald-500/20 p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                       <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold">Verification Required</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                       To maintain the privacy and quality of our talent pool, the Talent Spotlight is only accessible to verified organizations.
                    </p>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 mt-4">
                       Apply for Verification
                    </Button>
                 </Card>
               ) : (
                 <div className="space-y-6">
                    <div className="flex gap-4 items-center overflow-x-auto pb-2 scrollbar-none">
                       <Button 
                         variant={subjectFilter === 'all' ? 'primary' : 'outline'} 
                         className="rounded-full px-6"
                         onClick={() => setSubjectFilter('all')}
                       >
                         All Profiles
                       </Button>
                       {subjects.map(s => (
                         <Button 
                           key={s.id}
                           variant={subjectFilter === s.id ? 'primary' : 'outline'} 
                           className="rounded-full px-6 whitespace-nowrap border-white/10"
                           onClick={() => setSubjectFilter(s.id)}
                         >
                           {s.name}
                         </Button>
                       ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {loadingTalent ? (
                         Array(6).fill(0).map((_, i) => (
                           <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
                         ))
                       ) : talent.length > 0 ? (
                         talent.map((user) => (
                           <Card key={user.id} className="bg-white/5 border-white/5 p-6 hover:border-white/20 transition-all group">
                              <div className="flex gap-4 items-start mb-6">
                                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-[2px]">
                                    <div className="w-full h-full rounded-2xl bg-[#0d091a] overflow-hidden">
                                       {user.avatar_url ? (
                                         <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                       ) : (
                                         <div className="flex items-center justify-center h-full text-xl font-bold text-indigo-400">
                                            {user.full_name?.charAt(0)}
                                         </div>
                                       )}
                                    </div>
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-lg leading-tight">{user.full_name}</h4>
                                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                       <MapPin className="w-3 h-3" /> {user.college}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                       <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                          {user.reputation_points} Rep
                                       </span>
                                    </div>
                                 </div>
                              </div>
                              <p className="text-gray-400 text-sm line-clamp-2 mb-6 h-10">
                                 {user.bio || 'Highly motivated student with expertise in modern technologies.'}
                              </p>
                              <Button className="w-full bg-white/5 hover:bg-white/10 border-white/5 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                 View Credentials
                              </Button>
                           </Card>
                         ))
                       ) : (
                         <div className="col-span-full py-20 text-center">
                            <Search className="w-12 h-12 text-white/5 mx-auto mb-4" />
                            <p className="text-gray-500">No matching talent found in this category.</p>
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-black tracking-tight">Institutional Radar</h2>
                <p className="text-gray-500">Aggregate ecosystem engagement across all affiliated users.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-white/5 border-white/5 p-6 min-h-[400px]">
                   <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-widest text-emerald-400">Activity Distribution</CardTitle>
                   </CardHeader>
                   <CardContent className="flex items-center justify-center p-0 h-[300px]">
                      {/* Simple CSS-based visualization for now if Recharts isn't pre-configured */}
                      <div className="flex flex-col gap-4 w-full px-8">
                         {[
                           { label: 'Doubt Solved', val: 65, color: 'bg-indigo-500' },
                           { label: 'Test Attempted', val: 82, color: 'bg-emerald-500' },
                           { label: 'Mentor Booked', val: 45, color: 'bg-purple-500' },
                           { label: 'Cert Earned', val: 28, color: 'bg-yellow-500' },
                         ].map(item => (
                           <div key={item.label}>
                              <div className="flex justify-between text-xs mb-1">
                                 <span className="text-gray-400 font-bold uppercase">{item.label}</span>
                                 <span>{item.val}%</span>
                              </div>
                              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${item.val}%` }}
                                   transition={{ duration: 1, ease: 'easeOut' }}
                                   className={`h-full ${item.color}`}
                                 />
                              </div>
                           </div>
                         ))}
                      </div>
                   </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/5 p-6">
                   <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-widest text-emerald-400">Key Performance Indicators</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4 pt-6">
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                         <h4 className="text-emerald-400 font-bold text-lg">94% Retention</h4>
                         <p className="text-xs text-gray-500 mt-1">Users are 4x more likely to return after their first solved doubt.</p>
                      </div>
                      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                         <h4 className="text-indigo-400 font-bold text-lg">Active Spotlight</h4>
                         <p className="text-xs text-gray-500 mt-1">32 students currently have active recruitment profiles.</p>
                      </div>
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                         <h4 className="text-purple-400 font-bold text-lg">Institutional ROI</h4>
                         <p className="text-xs text-gray-500 mt-1">Estimated 450+ mentorship hours saved this trimester.</p>
                      </div>
                   </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Building2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
