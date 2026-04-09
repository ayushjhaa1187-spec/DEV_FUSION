'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Star } from 'lucide-react';

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
    href: '/auth'
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
    href: '/auth'
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
    cta: 'Become a Mentor',
    href: '/auth'
  }
];

const faqs = [
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel with one click. No hidden fees, no lock-in periods.' },
  { q: 'Is the free plan really free forever?', a: 'Absolutely. Explorer plan is free forever with no credit card required.' },
  { q: 'How does the Razorpay payment work?', a: 'We use Razorpay sandbox for secure payments. Your payment info is never stored on our servers.' },
  { q: 'Can I switch plans later?', a: 'Yes, upgrade or downgrade at any time. Changes take effect from the next billing cycle.' },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#09090f] text-white">
      {/* Hero */}
      <section className="pt-28 pb-16 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full border border-indigo-500/20 mb-6">
            Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            Invest in Your{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
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
            className={`relative rounded-2xl p-8 border flex flex-col ${
              plan.highlight
                ? 'bg-indigo-600/20 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105'
                : 'bg-white/5 border-white/10'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                {plan.badge}
              </span>
            )}

            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                {plan.icon === 'zap' ? <Zap className="w-5 h-5 text-indigo-400" /> :
                 plan.icon === 'star' ? <Star className="w-5 h-5 text-amber-400" /> :
                 <Sparkles className="w-5 h-5 text-emerald-400" />}
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-gray-400 text-sm mb-1">/{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check
                    size={16}
                    className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-indigo-400' : 'text-emerald-500'}`}
                  />
                  <span className="text-sm text-gray-300 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${
                plan.highlight
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              {plan.cta}
            </Link>
          </motion.div>
        ))}
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold text-center text-white mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
              <p className="text-gray-400 text-sm">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Strip */}
      <section className="pb-24 text-center px-4">
        <p className="text-gray-600 text-sm font-bold mb-6">Trusted by students at</p>
        <div className="flex flex-wrap justify-center gap-8 text-gray-400 font-semibold text-sm">
          {['IIT Bombay', 'BITS Pilani', 'NIT Trichy', 'VIT Vellore', 'NITK Surathkal'].map(college => (
            <span key={college} className="hover:text-gray-200 transition-colors cursor-default">{college}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
