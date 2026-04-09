import { motion } from 'framer-motion';

export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-6">
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute w-6 h-6 bg-indigo-500/20 rounded-full blur-xl"
        />
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-400 font-black text-sm uppercase tracking-widest animate-pulse"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function LoadingPage({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-[#0f0f1a] z-[99999] flex items-center justify-center">
        <LoadingSpinner text={text} />
    </div>
  );
}
