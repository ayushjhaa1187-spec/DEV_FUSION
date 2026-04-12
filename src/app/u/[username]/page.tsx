import PublicProfilePageClient from './PublicProfilePageClient';
import { Metadata } from 'next';

async function getProfile(username: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/profile/${username}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const data = await getProfile(username);
  if (!data?.profile) return { title: 'User Not Found | DEV_FUSION' };

  const { profile } = data;
  return {
    title: `${profile.full_name || profile.username} | SkillBridge`,
    description: profile.bio || `View ${profile.username}'s academic profile and contributions on SkillBridge.`,
    openGraph: {
      title: `${profile.full_name || profile.username} | SkillBridge`,
      description: profile.bio || `View ${profile.username}'s academic profile and contributions on SkillBridge.`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : []
    }
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <PublicProfilePageClient username={username} />;
}
