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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch full profile and reputation data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: badges } = await supabase
    .from('user_badges')
    .select('unlocked_at, badges(*)')
    .eq('user_id', user.id);

  return <ProfilePageClient user={user} initialProfile={profile} initialBadges={badges || []} />;
}

