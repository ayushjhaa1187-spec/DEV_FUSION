'use client';

import React from 'react';
import { Calendar, Info } from 'lucide-react';

interface StreakHeatmapProps {
  activityData: { activity_date: string; actions_count: number }[];
  loading?: boolean;
}

export const StreakHeatmap = ({ activityData, loading }: StreakHeatmapProps) => {
  // Generate last 140 days (approx 20 weeks)
  const days = Array.from({ length: 140 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (139 - i));
    const dayStr = date.toISOString().split('T')[0];
    
    // Find activity for this day
    const activity = activityData?.find(d => d.activity_date === dayStr);
    const count = activity?.actions_count || 0;
    
    return { date: dayStr, count };
  });

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-white/[0.03]';
    if (count <= 2) return 'bg-indigo-500/30';
    if (count <= 5) return 'bg-indigo-500/60';
    if (count <= 10) return 'bg-indigo-500/80';
    return 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]';
  };

  if (loading) {
    return (
      <div className="bg-[#13132b] p-6 rounded-[32px] border border-white/5 shadow-2xl animate-pulse">
        <div className="h-4 w-32 bg-white/5 rounded mb-6" />
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-4">
           {Array.from({ length: 140 }).map((_, i) => (
             <div key={i} className="w-[13px] h-[13px] rounded-[3px] bg-white/5" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#13132b] p-6 rounded-[32px] border border-white/5 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
          <Calendar size={14} className="text-indigo-500" />
          Consistency Matrix
        </div>
        <div className="group relative">
          <Info size={12} className="text-gray-600 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Intensity reflects total learning actions (doubts, tests, contributions) per day.
          </div>
        </div>
      </div>
      
      <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-4 scrollbar-hide">
        {days.map((day, i) => (
          <div 
            key={i}
            title={`${day.date}: ${day.count} actions recorded`}
            className={`w-[13px] h-[13px] rounded-[3px] transition-all duration-300 transform hover:scale-125 cursor-default ${getIntensityClass(day.count)}`}
          />
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-4 text-[9px] font-black uppercase tracking-widest text-gray-600">
        <span>4 Months Ago</span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
             <div className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.03]" />
             <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500/30" />
             <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500/60" />
             <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500/80" />
             <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500" />
          </div>
          <span>More</span>
        </div>
        <span>Today</span>
      </div>
    </div>
  );
};
