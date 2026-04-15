'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0612] flex items-center justify-center p-6 text-white text-center">
      <div className="max-w-md w-full p-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black mb-2">History Unavailable</h2>
        <p className="text-gray-400 mb-8">We encountered an error while retrieving your payment history. Don't worry, your transactions are safe.</p>
        <button 
          onClick={reset} 
          className="w-full py-4 rounded-2xl bg-white text-black font-black hover:bg-gray-100 transition-all uppercase text-sm tracking-widest"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
