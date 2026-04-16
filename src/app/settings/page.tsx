import { Suspense } from 'react';
import SettingsPageClient from './SettingsPageClient';
import Loading from './loading';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Settings | SkillBridge',
  description: 'Manage your account settings and preferences.',
  openGraph: {
    title: 'Settings | SkillBridge',
    description: 'Manage your account settings and preferences.',
    type: 'website',
  },
};

export default async function SettingsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?redirectTo=/settings');
  }
  return (
    <Suspense fallback={<Loading />}>
      <SettingsPageClient />
    </Suspense>
  );
}
