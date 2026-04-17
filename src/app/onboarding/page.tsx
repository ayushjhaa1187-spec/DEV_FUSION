import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import OnboardingClient from './OnboardingClient';

export const metadata: Metadata = {
  title: 'Onboarding | SkillBridge',
  description: 'Setup your profile and specialized traits to start your journey.',
};

export default async function OnboardingPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, college, branch')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || user.user_metadata?.role;

  // Organization users should not be blocked by student academic fields.
  if (role === 'organization' || role === 'campus_admin') {
    redirect('/organization/dashboard');
  }

  // Student/Mentor onboarding complete check.
  if (profile?.college && profile?.branch) {
    redirect(role === 'mentor' ? '/mentors/dashboard' : '/dashboard');
  }

  const { data: subjects } = await supabase.from('subjects').select('id, name');

  return <OnboardingClient user={user} profile={profile} subjects={subjects || []} />;
}
