import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

async function BillingOverview() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const [subRes, walletRes] = await Promise.all([
    fetch(`${base}/api/subscriptions`, { cache: 'no-store' }),
    fetch(`${base}/api/credits/balance`, { cache: 'no-store' }),
  ]);

  const sub = await subRes.json();
  const wallet = await walletRes.json();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 p-6 bg-white/5">
        <h2 className="text-xl font-bold text-white">Current Plan</h2>
        <p className="text-gray-300 mt-2">{sub?.subscription?.plan || 'free'} · Next billing: {sub?.nextBillingDate || 'N/A'}</p>
      </div>
      <div className="rounded-2xl border border-white/10 p-6 bg-white/5">
        <h2 className="text-xl font-bold text-white">Credit Wallet</h2>
        <p className="text-gray-300 mt-2">Balance: {wallet?.wallet?.balance ?? 0} credits</p>
      </div>
    </div>
  );
}

export default async function BillingPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  return (
    <main className="min-h-screen bg-[#0a0612] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-6">Billing Overview</h1>
        <Suspense fallback={<div className="h-40 rounded-2xl bg-white/5 animate-pulse" />}>
          <BillingOverview />
        </Suspense>
      </div>
    </main>
  );
}
