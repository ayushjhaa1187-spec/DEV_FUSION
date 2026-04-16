import AIToolsHubClient from './AIToolsHubClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Lab | SkillBridge',
  description: 'Neural-powered laboratory terminals designed to accelerate academic research and career readiness.',
  openGraph: {
    title: 'AI Lab | SkillBridge',
    description: 'Neural-powered laboratory terminals designed to accelerate academic research and career readiness.',
    type: 'website'
  }
};

export default function AIToolsHub() {
  return <AIToolsHubClient />;
}
