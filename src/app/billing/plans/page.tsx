import { Metadata } from 'next';
import Link from 'next/link';
import { Check, Zap, Star, ShieldCheck, Rocket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing & Plans | SkillBridge',
  description: 'Choose the right plan to accelerate your learning and expert growth.',
};

const PLANS = [
  {
    name: 'Free Starter',
    price: '0',
    desc: 'For curious learners starting their journey.',
    features: ['5 AI Resolve/Day', 'Public Community Access', 'Basic Profile', 'Standard Support'],
    cta: 'Continue Free',
    href: '/dashboard',
    highlight: false
  },
  {
    name: 'Pro Standard',
    price: '499',
    desc: 'For serious scholars demanding consistency.',
    features: ['Unlimited AI Resolve', 'Priority Community Answers', 'Verified Badge', 'Exclusive Mentors', 'Early Beta Access'],
    cta: 'Upgrade to Pro',
    href: '/upgrade?plan=pro',
    highlight: true,
    color: 'indigo'
  },
  {
    name: 'Elite Scholar',
    price: '1299',
    desc: 'For future industry leaders and experts.',
    features: ['All Pro Features', 'Personalized Learning Path', '1:1 Mentor Priority', 'Corporate Talent Discovery', 'Skill Certificates included'],
    cta: 'Go Elite',
    href: '/upgrade?plan=elite',
    highlight: false,
    color: 'violet'
  }
];

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-[#050510] text-white py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-8">
            <Zap size={14} /> Synaptic Tiers
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6">
            Choose your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Power Level</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">
            Transparent pricing for the next generation of academic excellence. No hidden fees, just raw knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan, i) => (
            <div 
              key={i} 
              className={`relative p-10 rounded-[48px] border transition-all duration-500 hover:scale-[1.02] ${
                plan.highlight 
                  ? 'bg-indigo-600/5 border-indigo-500/50 shadow-[0_0_80px_rgba(99,102,241,0.1)]' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-8 right-10 px-4 py-1.5 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <h2 className="text-2xl font-black mb-2">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mb-6">
                 <span className="text-4xl font-black">₹{plan.price}</span>
                 <span className="text-gray-500 text-sm font-bold">/month</span>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-10 leading-relaxed">{plan.desc}</p>

              <div className="space-y-4 mb-12">
                {plan.features.map((feat, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400">
                      <Check size={12} />
                    </div>
                    <span className="text-xs font-bold text-gray-300">{feat}</span>
                  </div>
                ))}
              </div>

              <Link 
                href={plan.href} 
                className={`w-full block text-center py-5 rounded-[24px] font-black uppercase tracking-widest text-[11px] transition-all ${
                  plan.highlight 
                    ? 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 shadow-indigo-500/20' 
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-24 p-12 bg-white/5 border border-white/5 rounded-[48px] flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
                 <ShieldCheck size={32} />
              </div>
              <div>
                 <h3 className="text-xl font-black">Secure Checkout</h3>
                 <p className="text-gray-500 text-sm font-medium">All transactions are encrypted and processed by Razorpay.</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
                 <Rocket size={32} />
              </div>
              <div>
                 <h3 className="text-xl font-black">Instant Activation</h3>
                 <p className="text-gray-500 text-sm font-medium">Get immediate access to premium features after payment.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
