'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, X, Share2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BadgeUnlockModalProps {
  badge: {
    name: string;
    description: string;
    icon?: string;
  } | null;
  onClose: () => void;
}

export function BadgeUnlockModal({ badge, onClose }: BadgeUnlockModalProps) {
  useEffect(() => {
    if (badge) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [badge]);

  return (
    <AnimatePresence>
      {badge && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="relative glass max-w-sm w-full p-10 rounded-[40px] border border-white/10 text-center shadow-2xl shadow-indigo-500/10 overflow-hidden bg-[#13132b]"
          >
            {/* Background Decorative Sparkle */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full" />

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="relative mb-8">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[32px] flex items-center justify-center mx-auto ring-1 ring-white/10"
              >
                <Award size={40} className="text-indigo-400" />
              </motion.div>
              <div className="absolute -top-2 -right-2 p-2 bg-indigo-600 rounded-full border-4 border-[#13132b]">
                <Sparkles size={12} className="text-white animate-pulse" />
              </div>
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">New Achievement</h3>
            <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter text-white">
              {badge.name}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
              {badge.description}
            </p>

            <div className="flex flex-col gap-3">
              <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                <Share2 size={14} /> Share Achievement
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
