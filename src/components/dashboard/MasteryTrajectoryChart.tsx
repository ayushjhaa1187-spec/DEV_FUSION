'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Target, Info } from 'lucide-react';

interface MasteryTrajectoryChartProps {
  data: { recorded_at: string; avg_score: number; subject?: string }[];
  loading?: boolean;
}

export const MasteryTrajectoryChart = ({ data, loading }: MasteryTrajectoryChartProps) => {
  if (loading) {
    return (
      <div className="bg-[#13132b] p-6 rounded-[32px] border border-white/5 shadow-2xl h-[300px] animate-pulse">
        <div className="h-4 w-48 bg-white/5 rounded mb-8" />
        <div className="w-full h-48 bg-white/5 rounded" />
      </div>
    );
  }

  // Format dates for display
  const chartData = data?.map(d => ({
    ...d,
    date: new Date(d.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: Math.round(d.avg_score * 100)
  })) || [];

  return (
    <div className="bg-[#13132b] p-8 rounded-[32px] border border-white/5 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            <Target size={14} className="text-cyan-400" />
            Mastery Trajectory
          </div>
          <h3 className="text-white font-bold text-lg">Performance Velocity</h3>
        </div>
        <div className="group relative">
          <Info size={14} className="text-gray-600 cursor-help" />
          <div className="absolute bottom-full right-0 mb-3 w-64 p-3 bg-black/95 border border-white/10 rounded-2xl text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-20 shadow-2xl">
            This algorithm-driven line tracks your average mastery across all subjects over time. Consistent growth indicates high potential.
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a0a1f', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#fff'
              }}
              itemStyle={{ color: '#22d3ee' }}
              cursor={{ stroke: '#22d3ee', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#22d3ee" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
           <div className="w-2 h-2 rounded-full bg-cyan-400" /> Subject Mastery
        </div>
        <p className="text-[10px] text-gray-600 font-medium italic">
          Data points are generated after each conceptual practice test.
        </p>
      </div>
    </div>
  );
};
