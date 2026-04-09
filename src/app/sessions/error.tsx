'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface SessionsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SessionsError({ error, reset }: SessionsErrorProps) {
  useEffect(() => {
    console.error('[Sessions Error]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm mb-6">
          {error.message || 'Failed to load your sessions. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>
  );
}
