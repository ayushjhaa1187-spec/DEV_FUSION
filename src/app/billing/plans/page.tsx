import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const plans = [
  { id: 'free', name: 'Free', price: '₹0/mo', features: ['5 AI solves/day', '3 tests/week'] },
  { id: 'pro', name: 'Pro', price: '₹149/mo', features: ['50 AI solves/day', '20 tests/week', 'Mentor booking'] },
  { id: 'elite', name: 'Elite', price: '₹349/mo', features: ['Unlimited AI', 'Unlimited tests', 'Coaching report'] },
];

export default async function BillingPlansPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-black mb-6">Billing Plans</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="p-6 rounded-2xl border border-white/10 bg-white/5">
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="text-2xl mt-2">{plan.price}</p>
            <ul className="mt-4 text-sm text-gray-300 list-disc pl-5 space-y-1">
              {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
