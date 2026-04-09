import SettingsPageClient from './SettingsPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | DEV_FUSION',
  description: 'Manage your account settings and preferences.',
  openGraph: {
    title: 'Settings | DEV_FUSION',
    description: 'Manage your account settings and preferences.',
    type: 'website'
  }
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
