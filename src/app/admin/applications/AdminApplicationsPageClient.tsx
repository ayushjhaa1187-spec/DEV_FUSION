'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function AdminApplicationsPageClient() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function checkAdminAndLoad() {
      setLoading(true);
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
          .eq('status', filter)
          .order('created_at', { ascending: false });
        setApps(data || []);
      }
      setLoading(false);
    }
    checkAdminAndLoad();
  }, [filter]);

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
    <div className="min-h-screen bg-[#0d0d1a] text-white p-8">
      <div className="max-w-6xl mx-auto pt-20">
        <header className="mb-12">
          <h1 className="text-4xl font-black mb-4">Mentor <span>Vetting</span></h1>
          <p className="text-gray-500">Review and approve applications for the next generation of SkillBridge mentors.</p>
        </header>

        {/* Status Tabs */}
        <div className="flex gap-4 p-2 bg-white/5 w-fit rounded-2xl border border-white/5 mb-12">
          {(['pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                filter === s ? 'bg-indigo-600 shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              {s} <span className={`px-2 py-0.5 rounded-md text-[10px] ${filter === s ? 'bg-white/20' : 'bg-white/5'}`}>{counts[s]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2].map(i => <div key={i} className="bg-[#13132b] h-64 rounded-[40px] border border-white/5" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apps.length > 0 ? apps.map((app) => (
              <div key={app.id} className="bg-[#13132b] border border-white/5 p-8 rounded-[40px] hover:border-indigo-500/20 transition-all group relative overflow-hidden">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black shadow-xl shadow-indigo-500/20">
                    {app.profiles.full_name?.[0] || app.profiles.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black flex items-center gap-2">
                       {app.profiles.full_name || app.profiles.username}
                    </h3>
                    <p className="text-gray-500 text-sm font-bold">@{app.profiles.username} • <span className="text-indigo-400">{app.profiles.reputation_points} Rep</span></p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Expertise Areas</div>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(app.expertise || '[]').map((area: string) => (
                      <span key={area} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase text-gray-400">{area}</span>
                    ))}
                  </div>
                </div>

                {filter === 'pending' && (
                  <div className="flex gap-4 pt-6 border-t border-white/5">
                    <button
                      onClick={() => handleAction(app.user_id, 'approved')}
                      disabled={!!processingId}
                      className="flex-1 py-4 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      {processingId === app.user_id ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(app.user_id, 'rejected')}
                      disabled={!!processingId}
                      className="flex-1 py-4 bg-white/5 hover:bg-red-600/20 text-gray-500 hover:text-red-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      {processingId === app.user_id ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : 'Reject'}
                    </button>
                  </div>
                )}

                {filter !== 'pending' && (
                  <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-600 text-right">
                    Processed on {new Date(app.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
