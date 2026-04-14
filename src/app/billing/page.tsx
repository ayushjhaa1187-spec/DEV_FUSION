import { Suspense } from 'react';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function BillingContent() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: subscription }, { data: wallet }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('credit_wallets')
      .select('balance, lifetime_purchased')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const plan = subscription?.plan || subscription?.plan_id || 'free';

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6 text-white text-center sm:text-left">
      <h1 className="text-3xl font-black mb-8">Billing Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Current Plan</p>
          <p className="text-3xl font-black mt-2 capitalize">{plan}</p>
          <p className="text-sm text-gray-400 mt-2">Next billing: {subscription?.current_end || subscription?.current_period_end ? new Date(subscription.current_end || subscription.current_period_end!).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Credit Wallet</p>
          <p className="text-3xl font-black mt-2">{wallet?.balance ?? 0}<span className="text-lg font-medium ml-2 text-gray-400">credits</span></p>
          <p className="text-sm text-gray-400 mt-2">Lifetime purchased: {wallet?.lifetime_purchased ?? 0}</p>
        </div>
      </div>
      <div className="flex gap-4 flex-wrap justify-center sm:justify-start mt-8 pt-6 border-t border-white/5">
        <Link href="/billing/plans" className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">Manage Plans</Link>
        <Link href="/billing/credits" className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">Buy Credits</Link>
        <Link href="/billing/history" className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">Billing History</Link>
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
      <Suspense fallback={<div className="h-40 rounded-2xl bg-white/5 animate-pulse" />}>
        <BillingContent />
      </Suspense>
    </main>
  );
}
