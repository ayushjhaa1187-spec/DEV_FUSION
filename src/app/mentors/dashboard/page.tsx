import { Metadata } from 'next';
import MentorDashboardClient from './MentorDashboardClient';

export const metadata: Metadata = {
  title: 'Mentor Dashboard | SkillBridge',
  description: 'Manage your sessions, track earnings, and grow your mentoring legacy.',
};

export default function MentorDashboardPage() {
  return <MentorDashboardClient />;
}
