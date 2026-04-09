'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-3xl">⚠️</span>
      </div>
      <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Something went wrong</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
        The application encountered an unexpected error. Don't worry, your progress is safe.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-8 py-3 bg-white/5 text-gray-400 rounded-xl font-black uppercase tracking-widest text-xs hover:text-white transition"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
