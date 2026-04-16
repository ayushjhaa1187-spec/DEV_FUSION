import { Metadata } from 'next';
import { Briefcase, ArrowRight, Heart, Globe, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers | SkillBridge Academy',
  description: 'Join the mission to bridge the gap between knowledge and mastery.',
};

export default function CareersPage() {
  const perks = [
    { icon: <Globe size={20} />, title: 'Remote First', desc: 'Work from anywhere in the world.' },
    { icon: <Heart size={20} />, title: 'Health & Wellness', desc: 'Comprehensive medical and fitness cover.' },
    { icon: <Zap size={20} />, title: 'Rapid Growth', desc: 'Learning budget for every employee.' },
    { icon: <Users size={20} />, title: 'Incredible Team', desc: 'Collaborate with industry experts.' }
  ];

  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
      <div className="max-w-4xl mx-auto text-center">
        <header className="mb-20">
          <div className="inline-flex items-center gap-2 text-indigo-500 mb-6">
            <Briefcase size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Join the mission</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            Build the future of <span className="text-indigo-500">Learning.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed font-medium max-w-2xl mx-auto">
            We're a team of designers, engineers, and educators redefining how students master complex subjects. Join us on this journey.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 text-left">
           {perks.map(perk => (
             <div key={perk.title} className="bg-white/5 border border-white/10 p-10 rounded-[40px] hover:border-indigo-500/20 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                  {perk.icon}
                </div>
                <h3 className="text-2xl font-black mb-3">{perk.title}</h3>
                <p className="text-gray-500 font-bold leading-relaxed">{perk.desc}</p>
             </div>
           ))}
        </section>

        <section className="bg-indigo-600 rounded-[50px] p-20 text-white">
          <h2 className="text-4xl font-black mb-6">No Openings Right Now?</h2>
          <p className="text-indigo-100 text-lg mb-12 max-w-xl mx-auto font-medium">
            We're always looking for talented individuals. Send us your portfolio and we'll keep you in mind for future roles.
          </p>
          <a href="mailto:careers@skillbridge.academy" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-10 py-5 rounded-[24px] font-black hover:scale-105 transition-all">
            Send Portfolio <ArrowRight size={20} />
          </a>
        </section>
      </div>
    </main>
  );
}
