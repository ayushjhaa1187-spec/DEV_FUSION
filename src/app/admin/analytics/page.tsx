import AdminAnalyticsPageClient from './AdminAnalyticsPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Authority Console | SkillBridge',
  description: 'Ecosystem analytics and moderation dashboard for platform administrators.',
  openGraph: {
    title: 'Platform Authority Console | SkillBridge',
    description: 'Ecosystem analytics and moderation dashboard for platform administrators.',
    type: 'website'
  }
};

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsPageClient />;
}
