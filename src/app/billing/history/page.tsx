import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function BillingHistoryPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: txns } = await supabase
    .from('transactions')
    .select('id, amount, currency, status, type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-black mb-6">Billing History</h1>
      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left"><tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {(txns || []).map((txn) => (
              <tr key={txn.id} className="border-t border-white/10">
                <td className="p-3">{new Date(txn.created_at).toLocaleDateString()}</td>
                <td className="p-3">{txn.type}</td>
                <td className="p-3">{txn.currency} {txn.amount}</td>
                <td className="p-3">{txn.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
