import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import DashboardPageClient from './DashboardPageClient';
import DashboardLoading from './loading';
import { Metadata } from 'next';
import HeatPulse from '@/components/dashboard/HeatPulse';

export const metadata: Metadata = {
  title: 'Dashboard | SkillBridge',
  description: 'Manage your learning progress, doubts, and mentorship sessions.',
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth');
  }

  // Fetch profile to check role and ensure data exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // If profile is missing, it might be an RLS issue or first-time login
    // In a production app, we might redirect to onboarding
    console.error('Profile fetch error in DashboardPage:', profileError);
  }

  const role = profile?.role || user.user_metadata?.role;

  // Role-based redirects
  if (role === 'mentor') {
    redirect('/mentors/dashboard');
  }

  if (role === 'organization' || role === 'campus_admin' || role === 'institution') {
    redirect('/organization/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black/50">
      <Suspense fallback={<DashboardLoading />}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">{profile?.full_name?.split(' ')[0] || 'Scholar'}</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Your daily learning momentum pulse.</p>
          </header>

          {/* Activity HeatPulse (Priority 6) */}
          <Suspense fallback={<div className="h-48 bg-white dark:bg-gray-900 animate-pulse rounded-3xl border border-gray-100 dark:border-gray-800" />}>
            <HeatPulse userId={user.id} />
          </Suspense>

          {/* Original Dashboard Content */}
          <DashboardPageClient />
        </div>
      </Suspense>
    </div>
  );
}
