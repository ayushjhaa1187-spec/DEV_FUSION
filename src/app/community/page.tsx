import CommunityPageClient from './CommunityPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Tribe | DEV_FUSION',
  description: 'Connect with 10,000+ students from colleges across India. Learn together, solve together, grow together.',
  openGraph: {
    title: 'Community Tribe | DEV_FUSION',
    description: 'Connect with 10,000+ students from colleges across India. Learn together, solve together, grow together.',
    type: 'website'
  }
};

export default function CommunityPage() {
  return <CommunityPageClient />;
}
