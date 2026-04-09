'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black gap-4 text-white">
      <h2 className="text-xl font-semibold">Connection Error</h2>
      <p className="text-gray-500 text-sm max-w-md text-center">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Retry Connection
      </button>
    </div>
  );
}
