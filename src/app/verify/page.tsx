'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, Award, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifySearchPage() {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hash.trim()) return;
    setLoading(true);
    // Redirect to the dynamic route for actual DB verification
    router.push(`/verify/${hash.trim()}`);
  };

  return (
    <div className="min-h-screen bg-[#06060c] pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-10 shadow-2xl">
            <ShieldCheck size={40} />
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-tight">
            Verify <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Authenticity</span>
          </h1>
          <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-16 px-4">
            SkillBridge credentials are cryptographically signed and immutable. Enter the unique verification hash found at the bottom of the certificate to validate its state.
          </p>

          <form 
            onSubmit={handleVerify}
            className="w-full max-w-2xl bg-white/5 border border-white/10 p-2 rounded-[32px] flex items-center gap-2 backdrop-blur-xl shadow-2xl focus-within:border-indigo-500/30 transition-all"
          >
            <div className="pl-6 text-gray-400">
              <Search size={22} />
            </div>
            <input 
              type="text"
              placeholder="Enter 32-character verification hash..."
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              className="flex-1 bg-transparent py-5 px-4 text-white font-medium outline-none placeholder:text-gray-600 text-lg"
            />
            <button
              type="submit"
              disabled={loading || !hash.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white px-8 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 group shadow-xl shadow-indigo-600/20"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Verify Now
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 mb-20 w-full">
            {[
              { icon: CheckCircle2, title: 'Instant Check', desc: 'Directly synced with our issuing ledger.' },
              { icon: Award, title: 'Tamper Proof', desc: 'Cryptographic HASH ensures data integrity.' },
              { icon: ShieldCheck, title: 'Employer Grade', desc: 'Trusted by over 50+ institutional partners.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] text-left hover:bg-white/[0.04] transition-all"
              >
                <item.icon className="text-indigo-400 mb-6" size={24} />
                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">{item.title}</h4>
                <p className="text-gray-500 text-xs font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-gray-600 text-[10px] uppercase font-black tracking-[0.3em]">
            SkillBridge Security Protocol v4.0.2
          </p>
        </motion.div>
      </div>
    </div>
  );
}
