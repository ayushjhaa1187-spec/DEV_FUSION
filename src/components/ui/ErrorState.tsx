'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = "Connection to knowledge node failed.", onRetry }: ErrorStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center sb-glass py-20 border-red-500/10"
    >
      <div className="w-20 h-20 rounded-3xl bg-red-500/5 flex items-center justify-center mb-6 border border-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
        <AlertCircle size={40} className="text-red-500 opacity-80" />
      </div>
      <h3 className="text-xl font-black mb-2 tracking-tight">System Outage</h3>
      <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8 font-medium leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="sb-btn-secondary flex items-center gap-2 px-8 py-3 bg-red-500/5 hover:bg-red-500/10 border-red-500/20 text-red-500"
        >
          <RotateCcw size={16} /> Re-establish Link
        </button>
      )}
    </motion.div>
  );
}
