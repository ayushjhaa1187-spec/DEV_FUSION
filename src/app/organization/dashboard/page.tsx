import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import OrgDashboardClient from './OrgDashboardClient';

export const metadata: Metadata = {
  title: 'Organization Dashboard | SkillBridge',
  description: 'Manage your talent pool, affiliated mentors, and recruitment pipeline.',
};

export default async function OrganizationDashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  // 1. Fetch Organization Profile
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // If no organization record exists but they have the role, 
  // they might need to complete onboarding.
  if (!org) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profile?.role === 'organization') {
      redirect('/onboarding');
    } else {
      redirect('/dashboard');
    }
  }

  // 2. Fetch Initial Stats
  const { count: mentorCount } = await supabase
    .from('mentor_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('affiliated_org_id', org.id);

  const { count: interviewCount } = await supabase
    .from('organization_interviews')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled');

  // 3. Fetch Subjects for filter
  const { data: subjects } = await supabase.from('subjects').select('id, name');

  return (
    <OrgDashboardClient 
      org={org} 
      stats={{
        mentors: mentorCount || 0,
        interviews: interviewCount || 0,
        talentPool: 0 // Will be calculated client-side or filtered
      }}
      subjects={subjects || []}
    />
  );
}
