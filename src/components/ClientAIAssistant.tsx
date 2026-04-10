'use client';

import dynamic from 'next/dynamic';

const AIFloatingAssistant = dynamic(
  () => import('@/components/AIFloatingAssistant'),
  { ssr: false, loading: () => null }
);

export default function ClientAIAssistant() {
  return <AIFloatingAssistant />;
}
