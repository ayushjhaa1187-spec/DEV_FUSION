import DoubtDetailPageClient from './DoubtDetailPageClient';
import { Metadata } from 'next';

async function getDoubt(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/doubts/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const doubt = await getDoubt(id);
  if (!doubt) return { title: 'Doubt Not Found | DEV_FUSION' };

  return {
    title: `${doubt.title} | DEV_FUSION`,
    description: doubt.content?.substring(0, 160) || `Read and help solve this academic doubt on ${doubt.subjects?.name || 'SkillBridge'}.`,
    openGraph: {
      title: `${doubt.title} | DEV_FUSION`,
      description: doubt.content?.substring(0, 160) || `Read and help solve this academic doubt on ${doubt.subjects?.name || 'SkillBridge'}.`,
    }
  };
}

export default async function DoubtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoubtDetailPageClient id={id} />;
}
