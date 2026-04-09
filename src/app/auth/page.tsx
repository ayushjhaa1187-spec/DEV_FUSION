import AuthPageClient from './AuthPageClient';
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Access | SkillBridge',
  description: 'Sign in to access your peer learning network and start your academic journey.',
  openGraph: {
    title: 'Secure Access | SkillBridge',
    description: 'Sign in to access your peer learning network and start your academic journey.',
    type: 'website'
  }
};

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="sb-page"><div className="sb-loading text-white">Initializing secure access...</div></div>}>
      <AuthPageClient />
    </Suspense>
  );
}
