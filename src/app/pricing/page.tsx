'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Explorer',
    price: '₹0',
    period: 'Forever free',
    highlight: false,
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

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-36 pb-24">
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-8"
          >
            <Sparkles size={12} /> Transparent Pricing
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black font-heading tracking-tighter mb-6">
            Invest in Your <span>Edge</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            No tricks. No hidden fees. Cancel anytime. Built for students on a budget.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-[40px] p-10 border flex flex-col ${plan.highlight ? 'bg-gradient-to-b from-indigo-600/20 to-transparent border-indigo-500/50 shadow-2xl shadow-indigo-500/10' : 'bg-[#13132b] border-white/5'}`}
            >
              {plan.badge && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  {plan.badge}
                </span>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.highlight ? 'bg-indigo-600' : 'bg-white/5'}`}>
                    {plan.highlight ? <Zap size={18} className="text-white" /> : <Sparkles size={18} className="text-gray-400" />}
                  </div>
                  <h3 className="text-xl font-black">{plan.name}</h3>
                </div>
                <div className="text-5xl font-black mb-1">{plan.price}</div>
                <div className="text-gray-500 text-sm font-bold">{plan.period}</div>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check size={16} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-indigo-400' : 'text-emerald-500'}`} />
                    <span className="text-sm text-gray-300 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center py-4 rounded-2xl font-black text-sm transition-all ${plan.highlight ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust Strip */}
        <div className="mt-24 text-center">
          <p className="text-gray-600 text-sm font-bold mb-6">Trusted by students at</p>
          <div className="flex flex-wrap justify-center gap-8 text-gray-700 font-black text-sm">
            {['IIT Bombay', 'BITS Pilani', 'NIT Trichy', 'VIT Vellore', 'NITK Surathkal'].map(college => (
              <span key={college} className="hover:text-gray-400 transition-colors cursor-default">{college}</span>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
