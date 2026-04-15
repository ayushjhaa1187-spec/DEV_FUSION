import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import DashboardPageClient from './DashboardPageClient';
import Loading from './loading';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | DEV_FUSION',
  description: 'Manage your learning progress, doubts, and mentorship sessions.',
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const role = user.user_metadata?.role;

  if (role === 'mentor') {
    redirect('/mentors/dashboard');
  }

  if (role === 'organization' || role === 'campus_admin') {
    redirect('/organization/dashboard');
  }

  return (
    <Suspense fallback={<Loading />}>
      <DashboardPageClient />
    </Suspense>
  );
}
