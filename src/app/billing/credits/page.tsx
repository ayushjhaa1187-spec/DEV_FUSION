import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { CREDIT_PACKS } from '@/lib/plans';

export default async function BillingCreditsPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const packs = Object.entries(CREDIT_PACKS);

  return (
    <main className="min-h-screen bg-[#0a0612] p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Buy AI Credits</h1>
        <div className="grid md:grid-cols-2 gap-6">
          {packs.map(([key, p]) => (
            <form key={key} action="/api/credits/purchase" method="post" className="rounded-2xl border border-white/10 p-6 bg-white/5">
              <input type="hidden" name="pack" value={key} />
              <h2 className="text-xl font-bold capitalize">{key.replace('_', ' ')}</h2>
              <p className="text-gray-300 mt-2">{p.credits} credits</p>
              <p className="text-indigo-300 mt-1">₹{p.amountInr}</p>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}
