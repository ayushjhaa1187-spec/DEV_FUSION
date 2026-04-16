import ProgressPageClient from './ProgressPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Academic Progress | SkillBridge',
  description: 'Track your performance across AI-generated tests and identify subjects that need more focus.',
  openGraph: {
    title: 'Academic Progress | SkillBridge',
    description: 'Track your performance across AI-generated tests and identify subjects that need more focus.',
    type: 'website'
  }
};

export default function ProgressPage() {
  return <ProgressPageClient />;
}
