import { Metadata } from 'next';
import PracticeEngineClient from './PracticeEngineClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Practice Hub | SkillBridge Academy',
  description: 'AI-Powered Practice Tests with a Global Bank to help you master any subject instantly.',
};

export default function PracticePage() {
  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
        <div className="max-w-4xl mx-auto mb-8">
            <Link href="/resources" className="inline-flex items-center gap-2 text-rose-400 font-bold hover:text-rose-300 transition-all">
            <ArrowLeft size={16} /> Back to Resources
            </Link>
        </div>
      <PracticeEngineClient />
    </main>
  );
}
