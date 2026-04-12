import { Metadata } from 'next';
import NewDoubtClient from './NewDoubtClient';
import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Ask a Doubt | SkillBridge',
  description: 'Get instant conceptual clarity from peer mentors and AI.',
};

export default async function NewDoubtPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch subjects for the dropdown
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('name');

  return <NewDoubtClient subjects={subjects || []} />;
}
