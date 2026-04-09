import ProfilePageClient from './ProfilePageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile | DEV_FUSION',
  description: 'Manage your SkillBridge profile, track achievements, and view your academic activity.',
  openGraph: {
    title: 'My Profile | DEV_FUSION',
    description: 'Manage your SkillBridge profile, track achievements, and view your academic activity.',
    type: 'website'
  }
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
