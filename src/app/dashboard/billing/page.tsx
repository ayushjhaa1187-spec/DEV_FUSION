import React from 'react';
import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreditCard, Download, Receipt, Zap } from 'lucide-react';
import Link from 'next/link';

export default async function BillingDashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch billing state
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_tier, current_ai_credits')
    .eq('id', user.id)
    .single();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: invoices } = await supabase
    .from('billing_invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const isFree = profile?.current_tier === 'free';
  const tierName = profile?.current_tier === 'elite' ? 'Elite Scholar' : profile?.current_tier === 'pro' ? 'Pro Standard' : 'Free Starter';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Billing & Subscription</h1>
        <p className="text-gray-400">Manage your subscription, invoices, and AI credits.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Plan Overview */}
        <div className="bg-[#13132b] border border-white/5 rounded-3xl p-8 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Current Plan</p>
              <h2 className="text-3xl font-bold text-white capitalize">{tierName}</h2>
            </div>
            {!isFree && (
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
              </span>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-gray-400">Subscription ID</span>
              <span className="text-white font-mono text-sm">{subscription?.razorpay_subscription_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-gray-400">Renewal Date</span>
              <span className="text-white">
                {subscription?.current_end ? new Date(subscription.current_end).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            {isFree ? (
              <Link href="/pricing" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full text-center">
                Upgrade Plan
              </Link>
            ) : (
              <button disabled className="bg-white/5 text-gray-500 font-bold py-3 px-6 rounded-xl w-full text-center cursor-not-allowed border border-white/5">
                Manage via Razorpay Hub (Coming Soon)
              </button>
            )}
          </div>
        </div>

        {/* AI Credits Overview */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-[#13132b] border border-indigo-500/20 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Zap className="w-40 h-40 text-indigo-400" />
          </div>
          
          <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-1">Resource Limits</p>
          <h2 className="text-3xl font-bold text-white mb-6">AI Credits Wallet</h2>

          <div className="flex items-end gap-2 mb-8 mt-12">
            <span className="text-6xl font-black text-white">{profile?.current_ai_credits || 0}</span>
            <span className="text-indigo-200 text-xl font-medium mb-1.5">credits remaining</span>
          </div>

          <div className="bg-indigo-950/50 rounded-xl p-4 border border-indigo-500/30">
            <p className="text-sm text-indigo-200 leading-relaxed">
              Credits reset every billing cycle. Each AI doubt resolution consumes 1 credit. Tests use 0 credits.
            </p>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-[#13132b] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <Receipt className="text-gray-400 w-5 h-5" />
          <h3 className="text-lg font-bold text-white">Invoice History</h3>
        </div>
        
        <div className="p-0">
          {(!invoices || invoices.length === 0) ? (
            <div className="p-12 text-center text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No invoices found. You are currently on the free plan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/[0.02] text-xs uppercase font-bold tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Invoice ID</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-white">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{inv.razorpay_invoice_id}</td>
                      <td className="px-6 py-4 font-medium text-white">
                        {inv.currency} {inv.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.invoice_url ? (
                          <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium">
                            <Download className="w-4 h-4" /> Download
                          </a>
                        ) : (
                          <span className="text-gray-600">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
