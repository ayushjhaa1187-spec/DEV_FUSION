import MentorsPageClient from './MentorsPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find a Mentor | SkillBridge',
  description: 'Connect with expert mentors for 1-on-1 live sessions.',
  openGraph: {
    title: 'Find a Mentor | SkillBridge',
    description: 'Connect with expert mentors for 1-on-1 live sessions.',
    type: 'website'
  }
};

export default function MentorsPage() {
  return <MentorsPageClient />;
}
