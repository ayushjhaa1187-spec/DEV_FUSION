import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

export default async function BillingHistoryPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: txns } = await supabase
    .from('transactions')
    .select('id, amount, status, type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-[#0a0612] p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Billing History</h1>
        <div className="space-y-3">
          {(txns || []).map((t) => (
            <div key={t.id} className="rounded-xl border border-white/10 p-4 bg-white/5 flex justify-between">
              <div>
                <p className="font-semibold uppercase">{t.type}</p>
                <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p>₹{(t.amount / 100).toFixed(2)}</p>
                <p className="text-xs text-gray-400">{t.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
