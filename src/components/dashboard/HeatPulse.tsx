'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Info, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface HeatPulseProps {
  userId: string;
}

export default function HeatPulse({ userId }: HeatPulseProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch('/api/analytics/activity');
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error('HeatPulse data fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, [userId]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-white/5';
    if (count <= 2) return 'bg-violet-200 dark:bg-violet-900/30';
    if (count <= 5) return 'bg-violet-400 dark:bg-violet-700/50';
    if (count <= 10) return 'bg-violet-600 dark:bg-violet-500/80';
    return 'bg-violet-700 dark:bg-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)]';
  };

  // Generate last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dayStr = d.toISOString().split('T')[0];
    const activity = data?.heatmap?.find((h: any) => h.date === dayStr);
    return { date: dayStr, count: activity?.count || 0 };
  });

  if (loading) return <div className="h-48 bg-gray-100 dark:bg-white/5 animate-pulse rounded-[32px] border border-gray-100 dark:border-white/5" />;

  const momentum = data?.momentum?.value || 0;
  const isPositive = momentum >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#0a0a1a] p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-violet-600/10 flex items-center justify-center">
                <Flame size={20} className="text-violet-600 dark:text-violet-400" />
             </div>
             <div>
                <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white m-0">Momentum Pulse</h3>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Consistency Engine</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
           <div className="text-center">
              <div className={`text-2xl font-black flex items-center gap-2 ${isPositive ? 'text-emerald-500' : 'text-amber-500'}`}>
                 {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                 {Math.abs(momentum)}%
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">7D Velocity</p>
           </div>
           <div className="h-10 w-px bg-gray-100 dark:bg-white/10" />
           <div className="text-center">
              <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                 {data?.momentum?.current_actions || 0}
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Actions</p>
           </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-3">
         {last30Days.map((day, i) => (
           <motion.div
             key={i}
             whileHover={{ scale: 1.2, zIndex: 20 }}
             title={`${day.date}: ${day.count} Neural Actions`}
             className={`aspect-square w-full min-w-[12px] rounded-[6px] transition-all duration-500 cursor-crosshair ${getIntensityClass(day.count)}`}
           />
         ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
         <div className="flex items-center gap-4 text-[9px] text-gray-400 font-black uppercase tracking-widest">
            <span>30D History Profile</span>
            <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
               <div className="w-2.5 h-2.5 rounded-[2px] bg-gray-100 dark:bg-white/5" />
               <div className="w-2.5 h-2.5 rounded-[2px] bg-violet-600/30" />
               <div className="w-2.5 h-2.5 rounded-[2px] bg-violet-600/60" />
               <div className="w-2.5 h-2.5 rounded-[2px] bg-violet-600/80" />
               <div className="w-2.5 h-2.5 rounded-[2px] bg-violet-600" />
            </div>
         </div>
         <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-4 py-1.5 rounded-full">
            <Activity size={12} className="text-violet-500" />
            <span className="text-[9px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Neural Sync Stable</span>
         </div>
      </div>
    </motion.div>
  );
}
