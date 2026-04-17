import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { Metadata } from 'next';
import MentorDashboardClient from './MentorDashboardClient';

export const metadata: Metadata = {
  title: 'Mentor Dashboard | SkillBridge',
  description: 'Manage your sessions, track earnings, and grow your mentoring legacy.',
};

export default async function MentorDashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || user.user_metadata?.role;
  
  if (role !== 'mentor' && role !== 'admin') {
    redirect('/dashboard');
  }

  return <MentorDashboardClient />;
}
