import AdminApplicationsPageClient from './AdminApplicationsPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentor Vetting | SkillBridge',
  description: 'Review and approve applications for the next generation of SkillBridge mentors.',
  openGraph: {
    title: 'Mentor Vetting | SkillBridge',
    description: 'Review and approve applications for the next generation of SkillBridge mentors.',
    type: 'website'
  }
};

export default function AdminApplicationsPage() {
  return <AdminApplicationsPageClient />;
}
