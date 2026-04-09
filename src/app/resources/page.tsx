import ResourcesPageClient from './ResourcesPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Hub | DEV_FUSION',
  description: 'Access industry-standard curated video lectures and peer-contributed study materials in one unified laboratory.',
  openGraph: {
    title: 'Knowledge Hub | DEV_FUSION',
    description: 'Access industry-standard curated video lectures and peer-contributed study materials in one unified laboratory.',
    type: 'website'
  }
};

export default function ResourcesPage() {
  return <ResourcesPageClient />;
}
