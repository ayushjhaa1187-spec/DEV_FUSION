import AdminApplicationsPageClient from './AdminApplicationsPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentor Vetting | DEV_FUSION',
  description: 'Review and approve applications for the next generation of SkillBridge mentors.',
  openGraph: {
    title: 'Mentor Vetting | DEV_FUSION',
    description: 'Review and approve applications for the next generation of SkillBridge mentors.',
    type: 'website'
  }
};

export default function AdminApplicationsPage() {
  return <AdminApplicationsPageClient />;
}
