import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const packs = [
  { key: 'starter', label: 'Starter', credits: 50, price: 49 },
  { key: 'value', label: 'Value', credits: 150, price: 129 },
  { key: 'bulk', label: 'Bulk', credits: 500, price: 349 },
  { key: 'exam_sprint', label: 'Exam Sprint', credits: 1000, price: 599 },
];

export default async function BillingCreditsPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: wallet } = await supabase.from('credit_wallets').select('balance,lifetime_purchased').eq('user_id', user.id).maybeSingle();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-black mb-2">AI Credits</h1>
      <p className="text-gray-400 mb-6">Balance: {wallet?.balance ?? 0} · Lifetime: {wallet?.lifetime_purchased ?? 0}</p>
      <div className="grid md:grid-cols-4 gap-4">
        {packs.map((pack) => (
          <div key={pack.key} className="p-5 rounded-2xl border border-white/10 bg-white/5">
            <h3 className="font-bold">{pack.label}</h3>
            <p className="text-sm text-gray-300 mt-1">{pack.credits} credits</p>
            <p className="text-xl font-black mt-2">₹{pack.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
