'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0612] flex items-center justify-center p-6 text-white text-center">
      <div className="max-w-md w-full p-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="w-16 h-16 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-8">We couldn't load the AI credits store. Please try again or contact support if the problem persists.</p>
        <button 
          onClick={reset} 
          className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all uppercase text-sm tracking-widest shadow-lg shadow-indigo-600/20"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
