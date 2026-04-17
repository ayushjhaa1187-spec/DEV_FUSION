import React from 'react';
import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreditCard, Download, Receipt, Zap, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Subscriptions | SkillBridge',
  description: 'Manage your academic resources, plan upgrades, and credit history.',
};

export default async function BillingDashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch billing state
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_tier, current_ai_credits, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: invoices } = await supabase
    .from('billing_invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const isFree = profile?.current_tier === 'free';
  const tierName = profile?.current_tier === 'elite' ? 'Elite Scholar' : profile?.current_tier === 'pro' ? 'Pro Standard' : 'Free Starter';

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest w-fit mb-4">
           <CreditCard size={12} /> Financial Registry
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
          Universal <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Billing Hub</span>
        </h1>
        <p className="text-gray-500 font-medium max-w-xl">
          Manage your neural capacity, active subscriptions, and fiscal history within the SkillBridge ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Overview */}
        <div className="lg:col-span-2 bg-[#0a0a20] border border-white/5 rounded-[48px] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 -z-10 group-hover:scale-110 transition-transform duration-1000">
             <Star className="w-64 h-64 text-indigo-400" />
          </div>

          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-glow">Current Strategy</p>
              <h2 className="text-4xl font-black text-white">{tierName}</h2>
            </div>
            {!isFree && (
              <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" /> Active Payload
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
             <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Subscription Instance</p>
                <p className="text-white font-mono text-xs truncate">{subscription?.razorpay_subscription_id || 'LOCAL_GUEST_BYPASS'}</p>
             </div>
             <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Sync Cycle End</p>
                <p className="text-white font-bold text-sm">
                  {subscription?.current_end ? new Date(subscription.current_end).toLocaleDateString() : 'NEVER'}
                </p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/pricing" className="flex-1 bg-white text-black hover:bg-indigo-400 hover:text-white font-black uppercase tracking-widest text-[11px] py-5 px-8 rounded-2xl transition-all text-center shadow-xl">
               Modify Infrastructure
            </Link>
            <Link href="/billing/history" className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 font-black uppercase tracking-widest text-[11px] py-5 px-8 rounded-2xl transition-all text-center">
               View All Receipts
            </Link>
          </div>
        </div>

        {/* AI Credits Overview */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[48px] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative z-10 h-full flex flex-col">
            <div className="p-3 bg-white/20 rounded-2xl w-fit mb-6">
               <Zap className="text-white" size={24} />
            </div>
            
            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Neural Capacity</p>
            <h2 className="text-3xl font-black text-white mb-auto">Credits</h2>

            <div className="mt-8 mb-8">
              <div className="text-7xl font-black text-white tracking-tighter">{profile?.current_ai_credits || 0}</div>
              <p className="text-indigo-100/60 font-medium text-xs mt-2 uppercase tracking-widest">Available Fluxons</p>
            </div>

            <Link href="/billing/credits" className="w-full bg-black/20 hover:bg-black/40 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl border border-white/10 transition-all text-center backdrop-blur-md group-hover:gap-4 flex items-center justify-center gap-2">
               Injection Credits <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Invoice History Lite */}
      <div className="mt-20">
        <div className="flex items-center justify-between mb-8 px-4">
           <div className="flex items-center gap-3">
              <Receipt className="text-indigo-400 w-5 h-5" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Recent Ledger</h3>
           </div>
           <Link href="/billing/history" className="text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
              Full Statement →
           </Link>
        </div>
        
        <div className="bg-[#0a0a20] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
          {(!invoices || invoices.length === 0) ? (
            <div className="p-20 text-center text-gray-600">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 opacity-20">
                  <CreditCard size={32} />
               </div>
               <p className="font-bold uppercase tracking-widest text-xs">No ledger entries detected</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                    <th className="px-8 py-6">Timestamp</th>
                    <th className="px-8 py-6">ID</th>
                    <th className="px-8 py-6">Amount</th>
                    <th className="px-8 py-6">Verification</th>
                    <th className="px-8 py-6 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 text-gray-400">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 font-mono text-[10px] text-indigo-300">#{inv.razorpay_invoice_id?.slice(-8)}</td>
                      <td className="px-8 py-6 text-white font-black">
                        {inv.currency} {inv.amount}
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {inv.invoice_url ? (
                          <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all inline-flex items-center justify-center">
                            <Download size={14} />
                          </a>
                        ) : (
                          <span className="opacity-20">—</span>
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
