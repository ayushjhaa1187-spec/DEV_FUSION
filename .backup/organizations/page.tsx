import OrganizationsClient from './OrganizationsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organizations | SkillBridge',
  description: 'Join elite developer communities and college clubs to level up your peer learning network.',
};

export default function OrganizationsPage() {
  return (
    <main className="min-h-screen bg-bg-primary pt-16">
      <OrganizationsClient />
    </main>
  );
}
