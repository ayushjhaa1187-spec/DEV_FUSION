import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { CREDIT_PACKS } from '@/lib/plans';

export default async function BillingCreditsPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: wallet } = await supabase
    .from('credit_wallets')
    .select('balance, lifetime_purchased')
    .eq('user_id', user.id)
    .maybeSingle();

  const packs = Object.entries(CREDIT_PACKS);

  return (
    <main className="min-h-screen bg-[#0a0612] py-12 px-6 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black">AI Credits</h1>
            <p className="text-gray-400 mt-2">Power your learning with high-performance AI models</p>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <p className="text-xs text-indigo-400 font-bold uppercase">Current Balance</p>
            <p className="text-2xl font-black mt-1">{wallet?.balance ?? 0}<span className="text-sm font-medium ml-2 text-gray-400">credits</span></p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packs.map(([key, p]) => (
            <div key={key} className="group relative p-6 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300">
              <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-indigo-600 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Popular</div>
              <h3 className="text-xl font-bold capitalize mb-4">{key.replace('_', ' ')}</h3>
              <div className="space-y-2 mb-8">
                <p className="text-3xl font-black">{p.credits}<span className="text-sm font-medium text-gray-400 ml-1">Credits</span></p>
                <p className="text-indigo-300 font-bold">₹{p.amountInr}</p>
              </div>
              <button className="w-full py-3 rounded-2xl bg-white text-black font-black hover:bg-indigo-50 transition-colors uppercase text-sm tracking-wider">
                Purchase
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-8 rounded-3xl border border-white/10 bg-indigo-600/10 text-center">
          <p className="text-gray-300">Credits never expire and can be used for any AI-powered feature on SkillBridge.</p>
        </div>
      </div>
    </main>
  );
}
