import DashboardPageClient from './DashboardPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | DEV_FUSION',
  description: 'Manage your learning progress, doubts, and mentorship sessions.',
  openGraph: {
    title: 'Dashboard | DEV_FUSION',
    description: 'Manage your learning progress, doubts, and mentorship sessions.',
    type: 'website'
  }
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
