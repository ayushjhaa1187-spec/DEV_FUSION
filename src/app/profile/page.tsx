import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfilePageClient from './ProfilePageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile | DEV_FUSION',
  description: 'Manage your SkillBridge profile, track achievements, and view your academic activity.',
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  // Fetch full profile and reputation data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const { data: badges } = await supabase
    .from('user_badges')
    .select('unlocked_at, badges(*)')
    .eq('user_id', session.user.id);

  return <ProfilePageClient user={session.user} initialProfile={profile} initialBadges={badges || []} />;
}

