'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';

interface CreditPulseProps {
  used: number;
  total: number | null; // null means unlimited
  plan: string;
}

export default function CreditPulse({ used, total, plan }: CreditPulseProps) {
  const percentage = total ? Math.min((used / total) * 100, 100) : 0;
  const isElite = plan === 'elite' || total === null;

  return (
    <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group shadow-2xl">
      {/* Background Glow */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] transition-colors duration-500 ${isElite ? 'bg-amber-500/10' : 'bg-indigo-500/10'}`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isElite ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'}`}>
              <Brain size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Neural Capacity</h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.15em] mt-1">{plan} Edition</p>
            </div>
          </div>
          {isElite && (
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5">
              <Zap size={10} className="text-amber-400" />
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Unlimited</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-end mb-3 px-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tracking-tighter">{used}</span>
              <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">/ {isElite ? '∞' : total} Solves</span>
            </div>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Used Today</span>
          </div>

          {!isElite && (
            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 1.5 }}
                className={`h-full rounded-full ${percentage > 80 ? 'bg-rose-500' : 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'}`}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-[9px] text-gray-500 font-medium leading-relaxed max-w-[180px]">
            {isElite 
              ? 'Infinite neural cycles active. Your cognitive capacity is unrestricted.' 
              : `Your daily quota resets at midnight. Upgrade to eliminate all latency.`}
          </p>
          
          {!isElite && (
            <Link 
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
            >
              Expand <ChevronRight size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
