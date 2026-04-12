'use client';

import { getRank, getUnlockedBadges } from '@/lib/reputation-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, Trophy, Sparkles } from 'lucide-react';

interface ReputationBadgeProps {
  points: number;
  showBadges?: boolean;
}

export default function ReputationBadge({ points, showBadges = false }: ReputationBadgeProps) {
  const rank = getRank(points);
  const unlockedBadges = getUnlockedBadges(points);

  const getRankConfig = (rankName: string) => {
    switch (rankName) {
      case 'Legend': return { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
      case 'Knowledge Guru': return { color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' };
      case 'Problem Solver': return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
      case 'Rising Star': return { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
      default: return { color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10' };
    }
  };

  const config = getRankConfig(rank);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${config.bg} ${config.border} border shadow-lg backdrop-blur-sm group transition-all duration-300 hover:scale-105 cursor-default`}>
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className={config.color} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
              {points}
            </span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
            {rank}
          </span>
        </div>

        {unlockedBadges.length > 0 && !showBadges && (
          <div className="flex -space-x-1.5">
            {unlockedBadges.slice(0, 2).map((badge) => (
              <div 
                key={badge.id} 
                title={badge.name}
                className="w-6 h-6 rounded-full bg-[#0c0c16] border border-white/10 flex items-center justify-center text-[10px] shadow-xl hover:z-10 hover:scale-110 transition cursor-help"
              >
                {badge.icon}
              </div>
            ))}
          </div>
        )}
      </div>

      {showBadges && unlockedBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {unlockedBadges.map((badge) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative"
            >
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 hover:bg-white/10 transition cursor-default">
                <span className="text-sm">{badge.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition">
                  {badge.name}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
