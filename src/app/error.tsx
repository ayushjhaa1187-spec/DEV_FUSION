'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('APP_LEVEL_ERROR:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="text-primary w-10 h-10" />
      </div>
      
      <h2 className="text-3xl font-heading font-bold mb-4 tracking-tight">Sync Disrupted</h2>
      <p className="text-text-secondary max-w-sm mx-auto mb-8">
        We encountered an issue while processing your request. The neural network remains stable, but this branch requires a restart.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="primary" icon={<RefreshCcw size={18} />} onClick={() => reset()}>
          Try Again
        </Button>
        <Link href="/">
          <Button variant="secondary" icon={<Home size={18} />}>
            Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
