import { Metadata } from 'next';
import Link from 'next/link';
import { Search, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Certificate Verification | SkillBridge',
  description: 'Verify the authenticity of SkillBridge certificates and academic achievements.',
};

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-[#050510] text-white py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-8">
           <ShieldCheck size={14} /> Official Verification Portal
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
          Validate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Expertise</span>
        </h1>
        
        <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto font-medium">
          Enter a certificate ID below to verify the authenticity of a scholar's credentials, issued and secured via the SkillBridge reputation engine.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-20">
           <div className="absolute inset-0 bg-indigo-500/20 blur-3xl opacity-20 -z-10" />
           <div className="bg-white/5 border border-white/10 p-2 rounded-[32px] flex items-center gap-2 shadow-2xl focus-within:border-indigo-500/50 transition-all">
              <div className="pl-6 text-gray-500">
                 <Search size={24} />
              </div>
              <input 
                type="text" 
                placeholder="Enter Certificate ID (e.g. SKB-2024-X92J)" 
                className="bg-transparent border-none outline-none flex-1 py-4 text-white font-bold placeholder:text-gray-600"
              />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-[24px] font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95">
                 Verify Registry
              </button>
           </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
           {[
             { icon: Award, title: 'AI-Validated', desc: 'Every certificate is backed by real-time academic simulations.' },
             { icon: CheckCircle2, title: 'Immutable', desc: 'Credentials are tied to the verified user profile history.' },
             { icon: ShieldCheck, title: 'Secure', desc: 'Direct registry lookup prevents credential counterfeiting.' }
           ].map((item, i) => (
             <div key={i} className="p-8 bg-white/5 border border-white/5 rounded-[40px] hover:bg-white/[0.08] transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <item.icon size={24} />
                </div>
                <h3 className="text-lg font-black mb-2">{item.title}</h3>
                <p className="text-gray-500 text-xs font-medium leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>

        <div className="mt-20 pt-10 border-t border-white/5">
           <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">
             © 2026 SkillBridge Meta-Registry · All Rights Reserved
           </p>
        </div>
      </div>
    </div>
  );
}
