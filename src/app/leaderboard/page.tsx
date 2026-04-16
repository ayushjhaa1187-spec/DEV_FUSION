import LeaderboardPageClient from './LeaderboardPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard | SkillBridge',
  description: 'See how you rank against other learners in the community.',
  openGraph: {
    title: 'Leaderboard | SkillBridge',
    description: 'See how you rank against other learners in the community.',
    type: 'website'
  }
};

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}
