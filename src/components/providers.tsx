'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ToastProvider } from '@/components/ui/Toast';
import { GamificationListener } from '@/components/GamificationListener';
import { NotificationToastProvider } from '@/components/providers/NotificationToastProvider';

const ClientAIAssistant = dynamic(() => import('@/components/ClientAIAssistant'), { ssr: false });
const DailyStreakTracker = dynamic(() => import('@/components/auth/DailyStreakTracker'), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <NotificationToastProvider>
            <GamificationListener />
            <Suspense fallback={null}>
              <DailyStreakTracker />
            </Suspense>
            {children}
            <ClientAIAssistant />
          </NotificationToastProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

