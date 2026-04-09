import LiveSessionsPageClient from './LiveSessionsPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Sessions | DEV_FUSION',
  description: 'Join live interactive sessions from the mentors you follow and get instant clarification.',
  openGraph: {
    title: 'Live Sessions | DEV_FUSION',
    description: 'Join live interactive sessions from the mentors you follow and get instant clarification.',
    type: 'website'
  }
};

export default function LiveSessionsPage() {
  return <LiveSessionsPageClient />;
}
