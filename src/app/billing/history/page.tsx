import React from 'react';
import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreditCard, Download, Receipt, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing History | SkillBridge',
  description: 'View and download your full invoice history.',
};

export default async function BillingHistoryPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: invoices } = await supabase
    .from('billing_invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link href="/billing" className="inline-flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-12 hover:text-white transition-colors">
         <ArrowLeft size={14} /> Neural Return
      </Link>

      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
          Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Ledger</span>
        </h1>
        <p className="text-gray-500 font-medium max-w-xl">
          A comprehensive record of all transactions, subscriptions, and credit injections performed on this identity.
        </p>
      </div>

      <div className="bg-[#0a0a20] border border-white/5 rounded-[48px] overflow-hidden shadow-2xl">
        {(!invoices || invoices.length === 0) ? (
          <div className="p-32 text-center text-gray-600">
             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 opacity-20">
                <Receipt size={40} />
             </div>
             <p className="font-extrabold uppercase tracking-[0.3em] text-sm">Registry Empty</p>
             <p className="mt-4 text-xs font-medium">No financial events have been recorded for this user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-10 py-8">Timestamp</th>
                  <th className="px-10 py-8">Registry ID</th>
                  <th className="px-10 py-8">Asset Amount</th>
                  <th className="px-10 py-8">Verification Status</th>
                  <th className="px-10 py-8 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-10 py-8 text-gray-400">
                       <p className="text-white font-bold">{new Date(inv.created_at).toLocaleDateString()}</p>
                       <p className="text-[10px] uppercase opacity-50">{new Date(inv.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-10 py-8 font-mono text-[10px] text-indigo-300">
                       {inv.razorpay_invoice_id || `INTERNAL-${inv.id.slice(0,8)}`}
                    </td>
                    <td className="px-10 py-8">
                       <span className="text-lg font-black text-white">{inv.currency} {inv.amount}</span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-emerald-400">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest">
                           {inv.status}
                         </span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      {inv.invoice_url ? (
                        <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 p-4 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-[24px] transition-all font-black uppercase text-[10px] tracking-widest">
                          <Download size={14} /> PDF
                        </a>
                      ) : (
                        <span className="text-[10px] font-black uppercase opacity-20 tracking-widest">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-12 p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex items-center gap-6">
         <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <CreditCard size={24} />
         </div>
         <div className="flex-1">
            <h4 className="text-sm font-black text-white uppercase tracking-tight">Need a custom invoice?</h4>
            <p className="text-xs text-gray-500 font-medium">Contact our fiscal support node at support@skillbridge.io for enterprise or tax-compliant documentation.</p>
         </div>
         <Link href="/contact" className="sb-btn-secondary px-6 py-3 text-[10px] font-black uppercase tracking-widest">Support Node</Link>
      </div>
    </div>
  );
}
