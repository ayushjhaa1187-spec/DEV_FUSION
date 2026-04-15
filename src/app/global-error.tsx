'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Sparkles, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an analytics service or console
    console.error('CRITICAL_NEURAL_FAILURE:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-bg-primary text-text-primary antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-[32px] flex items-center justify-center mb-8 border border-red-500/20 shadow-2xl shadow-red-500/10">
            <Sparkles className="text-red-500 w-12 h-12" />
          </div>
          
          <h1 className="text-4xl font-black font-heading mb-4 tracking-tight">Ecosystem Breach</h1>
          <p className="text-text-secondary max-w-md mx-auto mb-10 font-medium">
            Our neural link has been momentarily disrupted. Error ID: <code className="bg-bg-secondary px-2 py-1 rounded text-primary">{error.digest || 'unknown'}</code>
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="primary" icon={<RefreshCcw size={18} />} onClick={() => reset()}>
              Re-initialize Link
            </Button>
            <Link href="/">
              <Button variant="secondary" icon={<Home size={18} />}>
                Return to Core
              </Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
