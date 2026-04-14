import { Suspense } from 'react';
import SettingsPageClient from './SettingsPageClient';
import Loading from './loading';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | DEV_FUSION',
  description: 'Manage your account settings and preferences.',
  openGraph: {
    title: 'Settings | DEV_FUSION',
    description: 'Manage your account settings and preferences.',
    type: 'website',
  },
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingsPageClient />
    </Suspense>
  );
}
