import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import SessionDetailClient from './SessionDetailClient';

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return <SessionDetailClient bookingId={id} userId={user.id} />;
}
