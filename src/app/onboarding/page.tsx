import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  // Check if they already have onboarding completed (has branch and college)
  const { data: profile } = await supabase
    .from('profiles')
    .select('college, branch')
    .eq('id', session.user.id)
    .single();

  if (profile?.college && profile?.branch) {
     // Already onboarded
     redirect('/dashboard');
  }

  // Provide subjects for the multi-select
  const { data: subjects } = await supabase.from('subjects').select('id, name');

  return <OnboardingClient user={session.user} subjects={subjects || []} />;
}
