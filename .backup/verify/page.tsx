'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Search, 
  ChevronRight, 
  Globe, 
  Lock,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifyLandingPage() {
  const [hash, setHash] = useState('');
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (hash.trim()) {
      router.push(`/verify/${hash.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#06060c] text-white selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 pt-32 lg:pt-48 pb-20 relative z-10 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-12"
        >
          <ShieldCheck size={14} />
          Secure Registry v2.0
        </motion.div>

        {/* Hero Text */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8"
        >
          Verify <span className="text-gray-500 italic">Academic</span> <br /> 
          <span className="text-white">Authenticity.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-lg max-w-2xl mx-auto mb-16 font-medium leading-relaxed"
        >
          The SkillBridge public ledger provides cryptographically signed verification for students and institutions. Paste your unique certificate hash below.
        </motion.p>

        {/* Verification Form */}
        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleVerify}
          className="relative max-w-2xl mx-auto group"
        >
          <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition" size={20} />
              <input 
                type="text" 
                placeholder="Enter 32-character SHA hash or verification ID..."
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                className="w-full h-20 pl-16 pr-8 bg-white/5 border border-white/10 rounded-3xl outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-lg font-bold placeholder:text-gray-600"
              />
            </div>
            <button 
              type="submit"
              disabled={!hash.trim()}
              className="px-10 h-20 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
            >
              Verify Record <ChevronRight size={18} />
            </button>
          </div>
        </motion.form>

        {/* Feature Grid */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          {[
            { icon: Globe, title: 'Global Trust', desc: 'Recognized by 200+ partner institutions worldwide.' },
            { icon: Lock, title: 'Tamper-Proof', desc: 'Protected by our private blockchain-inspired registry.' },
            { icon: Sparkles, title: 'Instant Merit', desc: 'Validate skills and certifications in milliseconds.' },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 border border-white/5">
                <item.icon size={24} />
              </div>
              <h3 className="text-xl font-black mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-32 pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-widest text-gray-600">
           <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Merit</span>
              <span>Ledger Logs</span>
           </div>
           <p>© 2026 SkillBridge Intelligence System</p>
        </div>
      </div>
    </div>
  );
}
