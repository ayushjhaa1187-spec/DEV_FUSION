'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0612] flex items-center justify-center p-6 text-white text-center">
      <div className="max-w-md w-full p-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black mb-2">Billing Dashboard Unavailable</h2>
        <p className="text-gray-400 mb-8">We encountered a secure connection issue while retrieving your billing data. Please try again.</p>
        <button 
          onClick={reset} 
          className="w-full py-4 rounded-2xl bg-white text-black font-black hover:bg-indigo-50 transition-all uppercase text-sm tracking-widest"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}
