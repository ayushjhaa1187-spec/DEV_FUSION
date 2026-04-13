'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  BarChart3, 
  ShieldAlert, 
  CreditCard, 
  Settings, 
  ChevronRight,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    users: 0,
    mentors: 0,
    revenue: 0,
    activeDoubts: 0
  });

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, profile, loading, router]);

  if (loading || !user) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
    </div>
  );

  const adminActions = [
    { name: 'Revenue & Subscriptions', icon: CreditCard, href: '/admin/revenue', color: 'text-emerald-400', desc: 'Manage billing and plans' },
    { name: 'Mentor Applications', icon: ShieldAlert, href: '/admin/applications', color: 'text-amber-400', desc: 'Review pending expert requests' },
    { name: 'Expert Management', icon: Users, href: '/admin/mentors', color: 'text-blue-400', desc: 'Manage roster and payouts' },
    { name: 'System Analytics', icon: BarChart3, href: '/admin/analytics', color: 'text-purple-400', desc: 'Platform growth metrics' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">Central Command</h1>
          <p className="text-gray-400">SkillBridge Platform Administrative Overview</p>
        </header>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Nodes', value: '1,284', icon: Users, color: 'indigo' },
            { label: 'Active Signals', value: '42', icon: Activity, color: 'emerald' },
            { label: 'Daily Revenue', value: '₹12,450', icon: TrendingUp, color: 'blue' },
            { label: 'Critical Errors', value: '0', icon: AlertCircle, color: 'amber' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition-all group">
              <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400 w-fit mb-4`}>
                <stat.icon size={24} />
              </div>
              <div className="text-3xl font-black mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Controls */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminActions.map((action, i) => (
              <Link 
                key={i} 
                href={action.href}
                className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.07] hover:border-indigo-500/30 transition-all group flex flex-col items-start"
              >
                <div className={`p-4 rounded-2xl bg-white/5 ${action.color} mb-6 group-hover:scale-110 transition-transform`}>
                  <action.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">{action.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{action.desc}</p>
                <div className="mt-auto flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-widest group-hover:text-indigo-300">
                  Access Portal <ChevronRight size={14} />
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Config */}
          <div className="space-y-8">
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-4">Platform Status</h3>
                  <div className="space-y-4">
                     {[
                        { label: 'Auth Engine', status: 'Online', color: 'bg-emerald-400' },
                        { label: 'AI Inference', status: 'Online', color: 'bg-emerald-400' },
                        { label: 'Payment Gateway', status: 'Online', color: 'bg-emerald-400' },
                        { label: 'CDN Nodes', status: 'Latency Lvl 1', color: 'bg-amber-400' },
                     ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-white/10 px-4 py-3 rounded-xl border border-white/10 backdrop-blur-md">
                           <span className="font-bold opacity-80">{item.label}</span>
                           <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`} />
                              <span className="text-[10px] font-black uppercase tracking-widest">{item.status}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="absolute -bottom-12 -right-12 text-white/5">
                  <Settings size={160} />
               </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-indigo-400" />
                  Live Event Log
               </h3>
               <div className="space-y-6">
                  {[
                     { user: 'ayush_j', action: 'Upgraded to Elite', time: '2m' },
                     { user: 'rahul_k', action: 'Post Doubt #128', time: '5m' },
                     { user: 'sigma_bot', action: 'Resolved AI Audit', time: '12m' },
                  ].map((log, i) => (
                     <div key={i} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-500">{i+1}</div>
                        <div>
                           <div className="text-xs font-bold text-white mb-0.5">
                              <span className="text-indigo-400">{log.user}</span> {log.action}
                           </div>
                           <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{log.time} ago</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
