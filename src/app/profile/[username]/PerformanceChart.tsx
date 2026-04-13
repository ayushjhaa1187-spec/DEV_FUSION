'use client';

import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface PerformanceChartProps {
  username: string;
}

export default function PerformanceChart({ username }: PerformanceChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${username}/test-scores`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div className="h-[300px] w-full bg-white/5 rounded-2xl animate-pulse flex items-center justify-center">
      <Activity className="w-8 h-8 text-indigo-500/20 animate-spin" />
    </div>
  );

  if (data.length < 2) return (
    <div className="bg-[#13132b] border border-white/5 rounded-2xl p-8 text-center">
       <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="text-gray-600" />
       </div>
       <h3 className="text-white font-bold mb-1">Growth Data Pending</h3>
       <p className="text-gray-500 text-sm">Take more practice tests to visualize your performance curve.</p>
    </div>
  );

  return (
    <div className="bg-[#13132b] border border-white/5 rounded-2xl p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Growth Curve</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Accuracy & Performance Analytics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black tracking-widest uppercase">
          <TrendingUp size={12} /> Live Progress
        </div>
      </div>

      <div className="h-[250px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              hide
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a3a', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
