'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Crown, ChevronRight, Lock } from 'lucide-react';
import Link from 'next/link';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  used?: number;
  total?: number;
}

export default function LimitReachedModal({
  isOpen,
  onClose,
  title = "Neural Capacity Reached",
  description = "You've exhausted your daily AI cognitive cycles. Upgrade to Pro for unlimited high-bandwidth doubt resolution.",
  actionText = "Upgrade to Pro",
  actionHref = "/pricing",
  used,
  total
}: LimitReachedModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
        >
          {/* Header Image/Pattern */}
          <div className="h-32 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-transparent relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/10">
                <Lock className="text-white w-8 h-8" />
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all z-10"
          >
            <X size={20} />
          </button>

          <div className="p-10 pt-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <Zap size={12} /> Limit Reached
            </div>

            <h2 className="text-3xl font-black text-white tracking-tighter mb-4 leading-tight">
              {title}
            </h2>
            
            <p className="text-gray-400 font-medium mb-8 leading-relaxed">
              {description}
            </p>

            {used !== undefined && total !== undefined && (
              <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  <span>Usage Cycle</span>
                  <span>{used} / {total} Units</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(used / total) * 100}%` }}
                    className="h-full bg-indigo-600"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href={actionHref}
                className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-indigo-600/20"
              >
                <Crown size={16} />
                {actionText}
                <ChevronRight size={14} />
              </Link>
              <button 
                onClick={onClose}
                className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-[10px] transition-all border border-white/5"
              >
                Later
              </button>
            </div>

            <p className="mt-8 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              Join 5,000+ elite students on SkillBridge Pro
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
