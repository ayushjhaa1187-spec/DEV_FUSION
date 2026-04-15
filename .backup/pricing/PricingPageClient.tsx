'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Star } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const plans = [
  {
    name: 'Explorer',
    price: '₹0',
    period: 'Forever free',
    highlight: false,
    icon: 'sparkles',
    color: 'emerald',
    features: [
      '5 AI doubt resolutions / month',
      '10 practice questions / day',
      'Community doubt feed access',
      'Basic leaderboard presence',
      '2 free course modules per course',
    ],
    cta: 'Get Started Free',
    href: '/auth',
    planId: null
  },
  {
    name: 'Pro Scholar',
    price: '₹199',
    period: 'per month',
    highlight: true,
    badge: 'Most Popular',
    icon: 'zap',
    color: 'indigo',
    features: [
      'Unlimited AI doubt resolutions',
      'Unlimited practice tests',
      'All course modules unlocked',
      'AI Resume Builder access',
      'Mock Interview Simulator',
      'Priority mentor booking',
      'Pro badge on profile',
      'Advanced analytics dashboard'
    ],
    cta: 'Upgrade to Pro',
    href: '#',
    planId: process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID || 'plan_Ovwxxx'
  },
  {
    name: 'Campus Pro',
    price: '₹499',
    period: 'per month',
    highlight: false,
    badge: 'For Mentors',
    icon: 'star',
    color: 'amber',
    features: [
      'Everything in Pro Scholar',
      'Mentor dashboard access',
      'Session earnings tracking',
      'Custom slot scheduling',
      'Priority listing in mentor search',
      'Dedicated mentor support'
    ],
    cta: 'Go Elite',
    href: '#',
    planId: process.env.NEXT_PUBLIC_RAZORPAY_ELITE_PLAN_ID || 'plan_Ovwyyy'
  }
];

const faqs = [
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel with one click. No hidden fees, no lock-in periods.' },
  { q: 'Is the free plan really free forever?', a: 'Absolutely. Explorer plan is free forever with no credit card required.' },
  { q: 'How does the Razorpay payment work?', a: 'We use Razorpay sandbox for secure payments. Your payment info is never stored on our servers.' },
  { q: 'Can I switch plans later?', a: 'Yes, upgrade or downgrade at any time. Changes take effect from the next billing cycle.' },
];

export default function PricingPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message);
      router.push('/dashboard/billing');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to apply coupon');
    } finally {
      setCouponLoading(null as any);
      setCouponLoading(false);
    }
  };

  const handleCheckout = async (planId: string | null) => {
    if (!planId) {
      router.push('/auth');
      return;
    }
    setLoading(planId);
    try {
      const res = await fetch('/api/billing/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
            toast.error('Please login to upgrade');
            router.push('/auth');
            return;
        }
        throw new Error(data.error);
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.id,
        name: 'SkillBridge',
        description: 'Monthly Subscription',
        handler: function (response: any) {
          toast.success('Subscription successful! Your account is upgrading.');
          router.push('/dashboard/billing');
        },
        theme: { color: '#6366f1' } // indigo-500
      };

      if ((window as any).Razorpay) {
          const razorpay = new (window as any).Razorpay(options);
          razorpay.open();
      } else {
          toast.error('Payment gateway not loaded yet. Please try again.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to initiate checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      {/* Hero */}
      <section className="pt-28 pb-16 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full border border-indigo-500/20 mb-6 font-black">
            Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tighter">
            Invest in Your{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Edge
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            No tricks. No hidden fees. Cancel anytime. Built for students on a budget.
          </p>
        </motion.div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-4 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className={`relative rounded-[32px] p-8 border flex flex-col ${
              plan.highlight
                ? 'bg-[#13132b] border-indigo-500 shadow-2xl shadow-indigo-500/10 scale-105 z-10'
                : 'bg-[#13132b]/50 border-white/5'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                {plan.badge}
              </span>
            )}

            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                {plan.icon === 'zap' ? <Zap className="w-6 h-6 text-indigo-400" /> :
                 plan.icon === 'star' ? <Star className="w-6 h-6 text-amber-400" /> :
                 <Sparkles className="w-6 h-6 text-emerald-400" />}
              </div>
              <h3 className="text-2xl font-black text-white mb-1">{plan.name}</h3>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">/{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-4 flex-1 mb-8 pt-6 border-t border-white/5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className={`flex-shrink-0 mt-1 w-4 h-4 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <Check size={10} strokeWidth={4} />
                  </div>
                  <span className="text-sm text-gray-400 font-medium leading-tight">{feature}</span>
                </li>
              ))}
            </ul>

            {plan.planId ? (
              <button
                onClick={() => handleCheckout(plan.planId)}
                disabled={loading !== null}
                className={`w-full block text-center py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {loading === plan.planId ? 'Processing...' : plan.cta}
              </button>
            ) : (
              <Link
                href={plan.href}
                className={`block text-center py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            )}
          </motion.div>
        ))}
      </section>

      {/* Coupon Section */}
      <section className="max-w-xl mx-auto px-4 pb-20">
        <div className="bg-[#13132b] border border-indigo-500/20 rounded-[32px] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
          <h3 className="text-xl font-black mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Have a Promo Code?
          </h3>
          <p className="text-gray-400 text-sm mb-6">Enter your campus partner or special deal code below.</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="Enter Code (e.g. AYUSH_DEAL26)" 
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors uppercase tracking-widest font-black"
            />
            <button 
              onClick={handleApplyCoupon}
              disabled={couponLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
            >
              {couponLoading ? 'Verifying...' : 'Apply Code'}
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-black text-center text-white mb-10 tracking-tighter">Frequently Asked Questions</h2>
        <div className="grid gap-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-[#13132b]/50 border border-white/5 rounded-2xl p-6"
            >
              <h4 className="font-bold text-white mb-2">{faq.q}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Strip */}
      <section className="pb-24 text-center px-4">
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] mb-10">Trusted by students at</p>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-gray-400 font-bold text-sm">
          {['IIT Bombay', 'BITS Pilani', 'NIT Trichy', 'VIT Vellore', 'NITK Surathkal'].map(college => (
            <span key={college} className="hover:text-white transition-colors cursor-default opacity-50 hover:opacity-100">{college}</span>
          ))}
        </div>
      </section>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </main>
  );
}
