import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import SessionDetailClient from './SessionDetailClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Session Room | DEV_FUSION',
  description: 'Join your live mentorship session and get instant conceptual clarification in a secure video environment.',
  openGraph: {
    title: 'Live Session Room | DEV_FUSION',
    description: 'Join your live mentorship session and get instant conceptual clarification in a secure video environment.',
    type: 'website'
  }
};

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
