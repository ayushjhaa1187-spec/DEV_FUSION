'use client'
import { useEffect } from 'react'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => { 
    console.error('Dashboard Error Recovery triggered:', error) 
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Something interrupted the feed!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        {error.message || "We encountered a temporary neural node failure while loading your dashboard."}
      </p>
      <button 
        onClick={() => reset()} 
        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
      >
        Retry Connection
      </button>
    </div>
  )
}
