import { Metadata } from 'next';
import OrgDashboardClient from './OrgDashboardClient';

export const metadata: Metadata = {
  title: 'Organization Dashboard | SkillBridge',
  description: 'Manage your campus, students, and academic credits in one place.',
};

export default function OrganizationDashboardPage() {
  return <OrgDashboardClient />;
}
