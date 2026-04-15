'use client';

import React from 'react';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface MomentumPulseProps {
  value: number;
  loading?: boolean;
}

export const MomentumPulse = ({ value, loading }: MomentumPulseProps) => {
  if (loading) {
    return (
      <div className="bg-[#13132b] p-6 rounded-[32px] border border-white/5 shadow-2xl h-full animate-pulse">
        <div className="h-4 w-32 bg-white/5 rounded mb-4" />
        <div className="h-12 w-24 bg-white/5 rounded" />
      </div>
    );
  }

  const isPositive = value >= 0;

  return (
    <div className="bg-[#13132b] p-6 rounded-[32px] border border-white/5 shadow-2xl h-full flex flex-col justify-between overflow-hidden relative group">
      {/* Decorative Pulse Background */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 blur-[60px] transition-all duration-1000 ${isPositive ? 'bg-emerald-500/20 group-hover:bg-emerald-500/40' : 'bg-red-500/20 group-hover:bg-red-500/40'}`} />
      
      <div>
        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <Zap size={14} className={isPositive ? 'text-emerald-400' : 'text-red-400'} />
          Momentum Pulse
        </div>
        
        <div className="flex items-baseline gap-2">
          <div className={`text-4xl font-black ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{value}%
          </div>
          <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            {isPositive ? <TrendingUp size={16} className="inline mr-1" /> : <TrendingDown size={16} className="inline mr-1" />}
            vs Last Week
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
          {isPositive 
            ? "Your learning frequency is increasing. You're entering a state of high cognitive flow." 
            : "Activity has dipped slightly. AI suggests a quick practice session to regain inertia."}
        </p>
      </div>

      {/* Pulsing Dot */}
      <div className="absolute top-6 right-6 flex items-center justify-center">
        <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-emerald-400' : 'text-red-400 animate-pulse'}`} />
        <div className={`absolute w-full h-full rounded-full animate-ping ${isPositive ? 'bg-emerald-400/50' : 'bg-red-400/50'}`} />
      </div>
    </div>
  );
};
