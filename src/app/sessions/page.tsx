import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import SessionsClient from './SessionsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Sessions | DEV_FUSION',
  description: 'Manage your upcoming and past mentorship sessions.',
  openGraph: {
    title: 'My Sessions | DEV_FUSION',
    description: 'Manage your upcoming and past mentorship sessions.',
    type: 'website'
  }
};

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return <SessionsClient userId={user.id} />;
}
