'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

interface StreakHeatmapProps {
  events: any[];
}

export const StreakHeatmap = ({ events }: StreakHeatmapProps) => {
  // Generate last 140 days (approx 20 weeks)
  const days = Array.from({ length: 140 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (139 - i));
    const dayStr = date.toISOString().split('T')[0];
    const hasEvent = events.some(e => {
        const eventDate = e.created_at || e.date;
        return eventDate.startsWith(dayStr);
    });
    return { date: dayStr, active: hasEvent };
  });

  return (
    <div className="bg-[#13132b] p-6 rounded-[32px] border border-white/5 shadow-2xl">
      <div className="flex items-center gap-2 mb-6 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
        <Calendar size={14} className="text-indigo-500" />
        Consistency Matrix
      </div>
      
      <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-4 scrollbar-hide">
        {days.map((day, i) => (
          <div 
            key={i}
            title={`${day.date}: ${day.active ? 'Activity recorded' : 'No activity'}`}
            className={`w-[13px] h-[13px] rounded-[3px] transition-all duration-300 transform hover:scale-125 ${
              day.active 
                ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                : 'bg-white/[0.03]'
            }`}
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
             <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500" />
          </div>
          <span>More</span>
        </div>
        <span>Today</span>
      </div>
    </div>
  );
};
