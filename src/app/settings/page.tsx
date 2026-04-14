import SettingsPageClient from './SettingsPageClient';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Settings | DEV_FUSION',
  description: 'Manage your account settings and preferences.',
  openGraph: {
    title: 'Settings | DEV_FUSION',
    description: 'Manage your account settings and preferences.',
    type: 'website'
  }
};

export default async function SettingsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?redirectTo=/settings');
  }

  return <SettingsPageClient />;
}
