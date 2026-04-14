import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function BillingPlansPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const plans = [
    { id: 'free', name: 'Free', price: '₹0', features: '5 AI solves/day, 3 quizzes/week' },
    { id: 'pro', name: 'Pro', price: '₹149/mo', features: '50 AI solves/day, 20 quizzes/week' },
    { id: 'elite', name: 'Elite', price: '₹349/mo', features: 'Unlimited + elite tools' },
  ];

  return (
    <main className="min-h-screen bg-[#0a0612] p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Choose your plan</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/10 p-6 bg-white/5">
              <h2 className="text-xl font-bold">{p.name}</h2>
              <p className="text-indigo-300 mt-2">{p.price}</p>
              <p className="text-gray-300 mt-4 text-sm">{p.features}</p>
              <Link href="/pricing" className="inline-block mt-6 px-4 py-2 rounded-xl bg-indigo-600">Upgrade</Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
