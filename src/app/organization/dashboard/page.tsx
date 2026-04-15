import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

export default async function OrganizationDashboardProxy() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || user.user_metadata?.role;
  const allowed = ['organization', 'campus_admin', 'institution'];
  
  if (!allowed.includes(role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-8 border border-emerald-500/30">
        <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h1 className="text-4xl font-black mb-4 tracking-tight">Organization Portal</h1>
      <p className="text-gray-400 max-w-md mb-12">
        Welcome to the SkillBridge Institutional Command Center. We are currently stabilizing your network nodes for B2B operations.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
          <div className="text-emerald-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Status</div>
          <div className="text-xl font-bold">Syncing Records...</div>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
          <div className="text-indigo-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Access</div>
          <div className="text-xl font-bold">Authenticated</div>
        </div>
      </div>
      <a href="/dashboard" className="mt-12 text-sm font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">
        Return to Personal Dashboard
      </a>
    </div>
  );
}
