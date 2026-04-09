import DoubtsPageClient from './DoubtsPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Doubts | DEV_FUSION',
  description: 'Ask questions, share knowledge, and get help from peers and mentors.',
  openGraph: { 
    title: 'Community Doubts | DEV_FUSION', 
    description: 'Ask questions, share knowledge, and get help from peers and mentors.',
    type: 'website' 
  },
};

export default function DoubtsPage() {
  return <DoubtsPageClient />;
}
