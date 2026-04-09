import HomePageClient from './HomePageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SkillBridge | Bridge the Gap. Learn. Earn. Grow.',
  description: 'SkillBridge turns your academic doubts into answered questions, your knowledge into reputation, and your goals into mentored reality.',
  openGraph: {
    title: 'SkillBridge | Bridge the Gap. Learn. Earn. Grow.',
    description: 'SkillBridge turns your academic doubts into answered questions, your knowledge into reputation, and your goals into mentored reality.',
    type: 'website',
    images: [{ url: '/og-image.png' }] // Assuming an OG image exists or will be added
  }
};

export default function HomePage() {
  return <HomePageClient />;
}
