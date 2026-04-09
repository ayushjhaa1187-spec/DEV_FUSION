import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import SessionsClient from './SessionsClient';

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
