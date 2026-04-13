'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ToastProvider } from '@/components/ui/Toast';
import { GamificationListener } from '@/components/GamificationListener';
import { NotificationToastProvider } from '@/components/providers/NotificationToastProvider';

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
            {children}
          </NotificationToastProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

