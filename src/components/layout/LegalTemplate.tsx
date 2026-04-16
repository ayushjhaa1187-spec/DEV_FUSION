'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText, Lock, CreditCard, RefreshCw, Truck } from 'lucide-react';

interface Section {
  title: string;
  content: string[];
}

interface LegalTemplateProps {
  title: string;
  lastUpdated: string;
  icon: any;
  sections: Section[];
}

export default function LegalTemplate({ title, lastUpdated, icon: Icon, sections }: LegalTemplateProps) {
  return (
    <main className="min-h-screen bg-[#050505] text-slate-300 pt-[120px] pb-[100px] px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-12 text-sm font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            Back to Hub
          </Link>

          <header className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-600/10 rounded-2xl text-indigo-500">
                <Icon size={32} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/60 block mb-1">
                  Legal Documents
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                  {title}
                </h1>
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Last updated: {lastUpdated}</p>
          </header>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.section
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 md:p-10 backdrop-blur-xl"
              >
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <span className="text-indigo-500/40 text-sm font-mono">{String(i + 1).padStart(2, '0')}.</span>
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.map((para, j) => (
                    <p key={j} className="text-slate-400 leading-relaxed text-sm md:text-base">
                      {para}
                    </p>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          <footer className="mt-20 pt-10 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Questions regarding this document? <br className="md:hidden" />
              Reach out to <a href="mailto:legal@skillbridge.edu.in" className="text-indigo-400 hover:underline">legal@skillbridge.edu.in</a>
            </p>
          </footer>
        </motion.div>
      </div>
    </main>
  );
}
