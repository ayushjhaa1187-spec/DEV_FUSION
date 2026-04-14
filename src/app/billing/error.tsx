'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="p-10 text-white">
      <h2 className="text-2xl font-bold mb-4">Billing page failed to load</h2>
      <button onClick={reset} className="px-4 py-2 rounded-lg bg-indigo-600">Try Again</button>
    </div>
  );
}
