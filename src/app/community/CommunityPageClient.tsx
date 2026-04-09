'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Hash, Flame, ArrowRight } from 'lucide-react';

const topicCircles = [
  { name: 'DSA & CP', members: '2.4k', color: 'indigo', emoji: '🧠', href: '/community/groups' },
  { name: 'System Design', members: '1.8k', color: 'purple', emoji: '⚙️', href: '/community/groups' },
  { name: 'Web Dev', members: '3.1k', color: 'emerald', emoji: '🌐', href: '/community/groups' },
  { name: 'GATE Prep', members: '4.2k', color: 'amber', emoji: '📚', href: '/community/groups' },
  { name: 'Interview Prep', members: '2.9k', color: 'red', emoji: '💼', href: '/community/groups' },
  { name: 'Open Source', members: '1.2k', color: 'blue', emoji: '🔓', href: '/community/groups' },
];

const activities = [
  { user: 'rahul_dev', action: 'answered a doubt in', target: 'Binary Trees', time: '2m ago', rep: '+15 XP' },
  { user: 'priya_cs22', action: 'joined the circle', target: 'System Design', time: '5m ago', rep: '+5 XP' },
  { user: 'arjun_bits', action: 'reached Gold tier', target: '', time: '10m ago', rep: '🥇' },
  { user: 'meera_nitk', action: 'asked a doubt in', target: 'OS Scheduling', time: '15m ago', rep: '' },
];

export default function CommunityPageClient() {
  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        
        {/* Hero */}
        <header className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Community
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black font-heading tracking-tighter mb-6"
          >
            Your Academic <span>Tribe</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-lg max-w-2xl mx-auto"
          >
            Connect with 10,000+ students from colleges across India. Learn together, solve together, grow together.
          </motion.p>
        </header>

        {/* Study Circles Grid */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black mb-2">Study Circles</h2>
              <p className="text-gray-600 text-sm">Real-time group chats organized by topic</p>
            </div>
            <Link href="/community/groups" className="flex items-center gap-2 text-indigo-400 font-black text-sm hover:gap-4 transition-all">
              Browse All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {topicCircles.map((circle, i) => (
              <motion.div
                key={circle.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={circle.href} className="group block glass p-8 rounded-[40px] border border-white/5 hover:border-indigo-500/30 transition-all">
                  <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">{circle.emoji}</div>
                  <h3 className="text-xl font-black mb-2">{circle.name}</h3>
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold">
                    <Users size={12} />
                    {circle.members} members
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Live Activity Feed */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="glass p-8 rounded-[40px] border border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Flame size={16} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black">Live Activity</h2>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>
            <div className="space-y-6">
              {activities.map((act, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm flex-shrink-0">
                    {act.user[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">
                      <span className="text-white font-bold">@{act.user}</span>{' '}
                      {act.action}{' '}
                      {act.target && <span className="text-indigo-400">{act.target}</span>}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{act.time}</p>
                  </div>
                  {act.rep && <span className="text-xs font-black text-emerald-400 flex-shrink-0">{act.rep}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[40px] relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative z-10">
              <MessageSquare size={40} className="mb-6 text-white/80" />
              <h3 className="text-3xl font-black mb-4">Start a Discussion</h3>
              <p className="text-indigo-100 opacity-80 mb-8 leading-relaxed">
                Got a concept that clicks? Share it. Got a doubt? Post it. The community is waiting.
              </p>
              <Link href="/doubts" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-black px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all">
                Post to Doubt Feed <ArrowRight size={18} />
              </Link>
            </div>
          </div>

        </section>
      </div>

      <Footer />
    </main>
  );
}
