import { Suspense } from 'react';
import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfilePageClient from './ProfilePageClient';
import Loading from './loading';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile | DEV_FUSION',
  description: 'Manage your SkillBridge profile, track achievements, and view your academic activity.',
};

export default async function ProfilePage() {
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Profile query failed:', profileError.message);
  }

  let ensuredProfile = profile;
  if (!ensuredProfile) {
    const { data: createdProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('*')
      .single();

    if (upsertError) {
      console.error('Profile upsert failed:', upsertError.message);
    } else {
      ensuredProfile = createdProfile;
    }
  }

  const { data: badges } = await supabase
    .from('user_badges')
    .select('unlocked_at, badges(*)')
    .eq('user_id', user.id);

  return (
    <Suspense fallback={<Loading />}>
      <ProfilePageClient user={user} initialProfile={ensuredProfile} initialBadges={badges || []} />
    </Suspense>
  );
}
