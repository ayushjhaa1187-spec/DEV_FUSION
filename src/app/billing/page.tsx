import { Suspense } from 'react';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function BillingContent() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: subscription }, { data: wallet }] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('credit_wallets').select('balance,lifetime_purchased').eq('user_id', user.id).maybeSingle(),
  ]);

  const plan = subscription?.plan || subscription?.plan_id || 'free';

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6 text-white">
      <h1 className="text-3xl font-black">Billing Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <p className="text-xs text-gray-400 uppercase">Current Plan</p>
          <p className="text-2xl font-bold mt-2 capitalize">{plan}</p>
          <p className="text-sm text-gray-400 mt-1">Next billing: {subscription?.current_end ? new Date(subscription.current_end).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <p className="text-xs text-gray-400 uppercase">Credit Wallet</p>
          <p className="text-2xl font-bold mt-2">{wallet?.balance ?? 0} credits</p>
          <p className="text-sm text-gray-400 mt-1">Lifetime purchased: {wallet?.lifetime_purchased ?? 0}</p>
        </div>
      </div>
      <div className="flex gap-3 flex-wrap">
        <Link href="/billing/plans" className="px-4 py-2 rounded-xl bg-indigo-600">Manage Plans</Link>
        <Link href="/billing/credits" className="px-4 py-2 rounded-xl bg-indigo-600">Buy Credits</Link>
        <Link href="/billing/history" className="px-4 py-2 rounded-xl bg-indigo-600">Billing History</Link>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return <Suspense fallback={<div className="p-10 text-white">Loading billing…</div>}><BillingContent /></Suspense>;
}
