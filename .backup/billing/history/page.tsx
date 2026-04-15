import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function BillingHistoryPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: txns } = await supabase
    .from('transactions')
    .select('id, amount, currency, status, type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-[#0a0612] py-12 px-6 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Billing History</h1>
        
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <th className="p-4 border-b border-white/10">Date</th>
                  <th className="p-4 border-b border-white/10">Type</th>
                  <th className="p-4 border-b border-white/10">Amount</th>
                  <th className="p-4 border-b border-white/10 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(!txns || txns.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-500 italic">No transactions found</td>
                  </tr>
                ) : (
                  txns.map((txn) => (
                    <tr key={txn.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-sm text-gray-300">
                        {new Date(txn.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="p-4 text-sm font-bold uppercase text-gray-200">
                        {txn.type}
                      </td>
                      <td className="p-4 text-sm font-black text-white">
                        {txn.currency} {(txn.amount / 100).toFixed(2)}
                      </td>
                      <td className="p-4 text-sm text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          txn.status === 'captured' || txn.status === 'completed' || txn.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : txn.status === 'failed'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
