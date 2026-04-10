'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function AdminApplicationsPageClient() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function checkAdminAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'admin') {
        setIsAdmin(true);
        const { data } = await supabase
          .from('mentor_applications')
          .select('*, profiles(username, full_name, avatar_url, reputation_points)')
          .eq('status', 'pending');
        setApps(data || []);
      }
      setLoading(false);
    }
    checkAdminAndLoad();
  }, []);

  const handleAction = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/mentors/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setApps(apps.filter(a => a.user_id !== userId));
      }
    } catch (err) {
      console.error('Action failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col items-center justify-center p-6 text-white animate-pulse">
      <div className="h-10 bg-white/5 rounded-xl w-64 mb-8" />
      <div className="h-4 bg-white/5 rounded-xl w-48" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-3xl">🚫</span>
      </div>
      <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Permission Denied</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
        You must be an administrator to access the mentor vetting console.
      </p>
      <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-white/5 text-gray-400 rounded-xl font-black uppercase tracking-widest text-xs hover:text-white transition">Go Home</button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <header className="mb-12">
          <h1 className="text-4xl font-black font-heading tracking-tighter mb-4">Mentor <span>Vetting</span></h1>
          <p className="text-gray-500 font-medium">Review and approve applications for the next generation of SkillBridge mentors.</p>
        </header>
        
        {apps.length === 0 ? (
          <div className="bg-[#13132b] border border-dashed border-white/10 p-20 text-center rounded-[40px]">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-8">✅</div>
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Queue Clear</h2>
            <p className="text-gray-500 font-medium">Great work! All mentor applications have been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {apps.map((app: any) => (
              <div key={app.id} className="bg-[#13132b] p-8 rounded-[40px] border border-white/5 hover:border-indigo-500/20 transition-all flex flex-col">
                <div className="flex gap-6 mb-8">
                  <img src={app.profiles.avatar_url || `https://ui-avatars.com/api/?name=${app.profiles.username}`} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/5" />
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{app.profiles.full_name || app.profiles.username}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-1">@{app.profiles.username} • <span className="text-indigo-400">{app.profiles.reputation_points} Rep</span></p>
                  </div>
                </div>
                
                <div className="mb-10 flex-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4 block">Expertise Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {app.expertise_areas?.map((ex: string) => (
                      <span key={ex} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">{ex}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-8 border-t border-white/5">
                  <button onClick={() => handleAction(app.user_id, 'approved')} className="flex-1 py-4 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">Approve</button>
                  <button onClick={() => handleAction(app.user_id, 'rejected')} className="flex-1 py-4 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
