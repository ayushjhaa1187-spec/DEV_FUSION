import AskDoubtPageClient from './AskDoubtPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ask a Doubt | SkillBridge',
  description: 'Ask the community and get instant AI-powered conceptual reviews to help you bridge your learning gaps.',
  openGraph: {
    title: 'Ask a Doubt | SkillBridge',
    description: 'Ask the community and get instant AI-powered conceptual reviews to help you bridge your learning gaps.',
    type: 'website'
  }
};

export default function AskDoubtPage() {
  return <AskDoubtPageClient />;
}
