'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Sparkles, Code, FileText, Mic, Brain, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const tools = [
  {
    title: 'Code Insight',
    desc: 'Deep logical breakdown of complex code snippets with time complexity analysis.',
    icon: <Code className="w-6 h-6" />,
    href: '/ai-tools/code-explainer',
    color: 'indigo'
  },
  {
    title: 'AI Resume Architect',
    desc: 'Transform your SkillBridge reputation and projects into a recruiter-ready PDF.',
    icon: <FileText className="w-6 h-6" />,
    href: '/ai-tools/resume-builder',
    color: 'emerald',
    comingSoon: true
  },
  {
    title: 'Mock Interview Lab',
    desc: 'Real-time technical interviews with adaptive Gemini-driven behavioral feedback.',
    icon: <Mic className="w-6 h-6" />,
    href: '/ai-tools/interview-sim',
    color: 'amber',
    comingSoon: true
  },
  {
    title: 'Path Finder',
    desc: 'Analyzes your test results to generate a personalized learning roadmap.',
    icon: <Brain className="w-6 h-6" />,
    href: '/dashboard', // Links back to health widget
    color: 'purple'
  }
];

export default function AIToolsHub() {
  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 py-32">
        <header className="mb-20 text-center">
           <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-8"
           >
             <Sparkles size={14} className="animate-pulse" />
             Gemini 1.5 Pro Powered
           </motion.div>
           <h1 className="text-5xl md:text-7xl font-black font-heading tracking-tighter mb-6">
             The Artificial <br /> <span>Intelligence Lab</span>
           </h1>
           <p className="text-gray-500 max-w-2xl mx-auto text-lg">
             A collection of neural-powered laboratory terminals designed to accelerate academic research and career readiness.
           </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {tools.map((tool, i) => (
             <motion.div
               key={tool.title}
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="group relative"
             >
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="glass p-12 rounded-[40px] border border-white/5 relative z-10 h-full flex flex-col">
                  {tool.comingSoon && (
                    <span className="absolute top-8 right-8 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
                      In Development
                    </span>
                  )}
                  <div className={`w-14 h-14 rounded-2xl bg-${tool.color}-500/10 flex items-center justify-center text-${tool.color}-400 mb-8`}>
                    {tool.icon}
                  </div>
                  <h3 className="text-3xl font-black mb-4">{tool.title}</h3>
                  <p className="text-gray-500 leading-relaxed mb-auto">{tool.desc}</p>
                  
                  <div className="mt-12 pt-8 border-t border-white/5">
                    {tool.comingSoon ? (
                      <span className="text-gray-700 font-bold text-sm cursor-not-allowed">Access Fragmented</span>
                    ) : (
                      <Link href={tool.href} className="flex items-center gap-2 font-black text-indigo-400 group-hover:gap-4 transition-all">
                        Initiate Terminal <ArrowRight size={18} />
                      </Link>
                    )}
                  </div>
               </div>
             </motion.div>
           ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
