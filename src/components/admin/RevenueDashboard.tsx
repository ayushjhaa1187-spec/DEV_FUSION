/**
 * components/admin/RevenueDashboard.tsx
 *
 * Visual analytics for SkillBridge revenue streams.
 * Tracking: Subscriptions, Credit Sales, Mentor Payouts, Net Platform Revenue.
 */

"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TrendingUp, Users, CreditCard, Banknote, ShieldAlert } from "lucide-react";

interface DashboardProps {
  stats: {
    totalRevenue: number;
    activeSubs: number;
    creditsSold: number;
    mentorPayouts: number;
    timelineData: any[];
    payoutRetentionData: any[];
  };
}

export default function RevenueDashboard({ stats }: DashboardProps) {
  const netRevenue = stats.totalRevenue - stats.mentorPayouts;

  return (
    <div className="space-y-6 text-white p-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          sub="MTD Growth: +12.5%"
          icon={<TrendingUp className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubs.toString()}
          sub="34 Pending renewals"
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Credits Sold"
          value={stats.creditsSold.toLocaleString()}
          sub="+1.2k today"
          icon={<CreditCard className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Net Platform Fee"
          value={`₹${netRevenue.toLocaleString()}`}
          sub="After mentor payouts"
          icon={<Banknote className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Growth Chart */}
        <div className="lg:col-span-2 bg-[#13111e] rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            Revenue Performance
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">Live</span>
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timelineData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2b3d" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "#1a1625", border: "1px solid #2d2b3d", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payout Distribution */}
        <div className="bg-[#13111e] rounded-2xl border border-white/5 p-6">
           <h3 className="text-lg font-semibold mb-6">Payout Retention</h3>
           <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.payoutRetentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2b3d" />
                <XAxis dataKey="tier" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ background: "#1a1625", border: "1px solid #2d2b3d", borderRadius: "8px" }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="payout" fill="#facc15" radius={[4, 4, 0, 0]} name="Paid to Mentors" />
                <Bar dataKey="commission" fill="#10b981" radius={[4, 4, 0, 0]} name="Platform Fee" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {stats.mentorPayouts > stats.totalRevenue * 0.4 && (
        <div className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
           <ShieldAlert className="w-6 h-6 text-amber-500" />
           <div className="flex-1">
             <h4 className="text-sm font-semibold text-amber-500">High Payout Ratio Warning</h4>
             <p className="text-xs text-amber-500/70">Current mentor payout cycle is exceeding 40% of gross revenue. Review commission tiers.</p>
           </div>
           <button className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-medium">Review Policies</button>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }: any) {
  const colorMap: any = {
    indigo: "from-indigo-500/10 to-transparent border-indigo-500/20 text-indigo-400",
    purple: "from-purple-500/10 to-transparent border-purple-500/20 text-purple-400",
    blue: "from-blue-500/10 to-transparent border-blue-500/20 text-blue-400",
    emerald: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-6`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium opacity-80">{title}</span>
        <div className={`p-2 rounded-lg bg-white/5`}>{icon}</div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-[11px] opacity-60 font-medium">{sub}</div>
      </div>
    </div>
  );
}
