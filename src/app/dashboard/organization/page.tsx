import { Metadata } from 'next';
import OrgDashboardClient from './OrgDashboardClient';

export const metadata: Metadata = {
  title: 'Organization Dashboard | SkillBridge',
  description: 'Manage your organization, members, and reputation settings.',
};

export default function OrgDashboardPage() {
  return <OrgDashboardClient />;
}
