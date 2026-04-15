import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

export default async function AdminDashboardRedirect() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || user.user_metadata?.role;
  
  if (role !== 'admin') {
    redirect('/dashboard');
  }

  // If already authorized, go to the main admin control center
  redirect('/admin');
}
