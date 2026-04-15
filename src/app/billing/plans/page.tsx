import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function BillingPlansPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const plans = [
    { 
      id: 'free', 
      name: 'Free', 
      price: '₹0', 
      features: ['5 AI solves/day', '3 quizzes/week', 'Community access'] 
    },
    { 
      id: 'pro', 
      name: 'Pro', 
      price: '₹149/mo', 
      features: ['50 AI solves/day', '20 quizzes/week', 'Mentor booking', 'Ad-free experience'] 
    },
    { 
      id: 'elite', 
      name: 'Elite', 
      price: '₹349/mo', 
      features: ['Unlimited AI solves', 'Unlimited quizzes', 'Priority coaching reports', '1-on-1 sessions'] 
    },
  ];

  return (
    <main className="min-h-screen bg-[#0a0612] py-16 px-6 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Choose Your Path</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Select a plan that fits your learning pace. All premium plans include a 7-day money-back guarantee.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((p) => (
            <div key={p.id} className={`relative p-8 rounded-3xl border ${p.id === 'pro' ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500' : 'border-white/10 bg-white/5'} flex flex-col`}>
              {p.id === 'pro' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-xs font-black uppercase tracking-widest text-white shadow-xl">Most Popular</div>
              )}
              <h2 className="text-2xl font-black mb-2">{p.name}</h2>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-black">{p.price}</span>
                {p.id !== 'free' && <span className="text-gray-400 ml-1 text-sm font-medium">/month</span>}
              </div>
              
              <ul className="space-y-4 mb-10 flex-grow">
                {p.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm text-gray-300">
                    <svg className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link 
                href={p.id === 'free' ? '/dashboard' : '/pricing'} 
                className={`w-full py-4 rounded-2xl font-black text-center transition-all ${p.id === 'pro' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-black hover:bg-gray-100'}`}
              >
                {p.id === 'free' ? 'Current Plan' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm">Need a custom plan for your institution? <Link href="/contact" className="text-indigo-400 font-bold hover:underline">Contact Sales</Link></p>
        </div>
      </div>
    </main>
  );
}
