import CoursesHubClient from './CoursesHubClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Educational Vault | DEV_FUSION',
  description: 'Master core engineering concepts with curated multi-module video courses delivered by specialized academics.',
  openGraph: {
    title: 'Educational Vault | DEV_FUSION',
    description: 'Master core engineering concepts with curated multi-module video courses delivered by specialized academics.',
    type: 'website'
  }
};

export default function CoursesHub() {
  return <CoursesHubClient />;
}
