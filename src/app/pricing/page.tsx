'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Brain, Rocket, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    description: 'Perfect for exploring the SkillBridge ecosystem.',
    features: [
      '5 AI Doubt Solves / day',
      '3 AI Practice Tests / week',
      'Community Feed access',
      'Public Reputation Profile',
      'Basic Badge progression'
    ],
    cta: 'Get Started',
    href: '/auth',
    color: 'border-white/10 text-gray-400',
    icon: Brain,
  },
  {
    name: 'Pro',
    price: '₹149',
    period: '/mo',
    description: 'For serious scholars leveling up their skills.',
    features: [
      '50 AI Doubt Solves / day',
      '20 AI Practice Tests / week',
      'Mentor Session booking',
      'Verified Pro Badge',
      'Ad-free experience',
      'Priority Subject support'
    ],
    cta: 'Upgrade to Pro',
    href: '/upgrade?plan=pro',
    color: 'border-indigo-500/30 text-indigo-400',
    popular: true,
    icon: Rocket,
  },
  {
    name: 'Elite',
    price: '₹349',
    period: '/mo',
    description: 'The ultimate professional learning suite.',
    features: [
      'Unlimited AI Doubt Solves',
      'Unlimited Practice Tests',
      'AI Coaching Reports',
      'Gold Elite Profile Shield',
      'Early access to features',
      'Exclusive Mentor webinars'
    ],
    cta: 'Go Elite',
    href: '/upgrade?plan=elite',
    color: 'border-amber-500/30 text-amber-400',
    icon: Zap,
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Neural Plan Infrastructure</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500"
          >
            Power Your <br /> Academic Pulse.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto font-medium"
          >
            SkillBridge subscriptions provide the high-performance AI cycles and verified credentials needed to thrive in the modern tech ecosystem.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -8 }}
              className={`relative bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border ${plan.color} flex flex-col group transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">
                  Most Preferred
                </div>
              )}

              <div className="mb-8">
                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border ${plan.color} group-hover:scale-110 transition-transform`}>
                  <plan.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 text-sm font-bold">{plan.period}</span>}
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-10 font-medium leading-relaxed">
                {plan.description}
              </p>

              <div className="space-y-4 mb-12 flex-1">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 group/item">
                    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover/item:border-indigo-500/50 transition-colors">
                      <Check className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                href={plan.href}
                className={`w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all text-center
                  ${plan.popular 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20' 
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Institutional Redirect */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-24 text-center p-12 bg-white/5 rounded-[4rem] border border-white/5 backdrop-blur-xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-left">
              <h4 className="text-2xl font-black mb-2 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                For Colleges & Institutions
              </h4>
              <p className="text-gray-500 text-sm font-medium">Empower your entire campus with centralized administrative dashboards and AI governance.</p>
            </div>
            <Link href="/about" className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
              Institutional Licensing
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
