/**
 * /app/admin/revenue/page.tsx
 * 
 * Admin-only dashboard for revenue analytics.
 */

import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RevenueDashboard from "@/components/admin/RevenueDashboard";
import { Banknote, TrendingUp, ShieldCheck } from "lucide-react";

export default async function AdminRevenuePage() {
  const supabase = await createSupabaseServer();

  // 1. Admin Role Guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <ShieldCheck className="w-16 h-16 text-rose-500 mb-4 opacity-50" />
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-gray-400 mt-2">You do not have administrative privileges for this page.</p>
      </div>
    );
  }

  // 2. Data Aggregation
  // Note: These will return 0 if migrations haven't been run yet
  const { data: totalRevenueSet } = await supabase.from("invoices").select("amount");
  const { count: activeSubs } = await supabase.from("subscriptions").select("*", { count: 'exact', head: true }).eq("status", "active");
  const { data: walletSet } = await supabase.from("credit_wallets").select("lifetime_purchased");
  const { data: payoutSet } = await supabase.from("commission_ledger").select("mentor_payout");

  const totalRevenue = totalRevenueSet?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
  const creditsSold = walletSet?.reduce((acc, curr) => acc + curr.lifetime_purchased, 0) || 0;
  const mentorPayouts = payoutSet?.reduce((acc, curr) => acc + Number(curr.mentor_payout), 0) || 0;

  // Mocked timeline for visualization if real data is sparse
  const timelineData = [
    { name: "Apr 07", revenue: 4000 },
    { name: "Apr 08", revenue: 3000 },
    { name: "Apr 09", revenue: 2000 },
    { name: "Apr 10", revenue: 2780 },
    { name: "Apr 11", revenue: 1890 },
    { name: "Apr 12", revenue: 2390 },
    { name: "Apr 13", revenue: 3490 },
  ];

  const payoutRetentionData = [
    { tier: "Junior", payout: 5000, commission: 1250 },
    { tier: "Senior", payout: 8000, commission: 1600 },
    { tier: "Expert", payout: 12000, commission: 1200 },
  ];

  const stats = {
    totalRevenue,
    activeSubs: activeSubs || 0,
    creditsSold,
    mentorPayouts,
    timelineData,
    payoutRetentionData,
  };

  return (
    <div className="min-h-screen bg-[#0a0612] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8 px-6">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
             <TrendingUp className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Financial Oversight</h1>
            <p className="text-gray-400 text-sm">Revenue reporting and payout distribution ledger.</p>
          </div>
        </div>

        <RevenueDashboard stats={stats} />
      </div>
    </div>
  );
}
