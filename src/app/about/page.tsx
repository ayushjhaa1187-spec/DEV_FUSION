import { Metadata } from 'next';
import { Target, Users, Zap, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | SkillBridge Academy',
  description: 'SkillBridge is bridging the gap between knowledge and mastery through peer-to-peer learning and AI assistance.',
};

export default function AboutPage() {
  const values = [
    { icon: <Users size={24} />, title: 'Peer Empowerment', desc: 'We believe students learn best from their peers in a collaborative ecosystem.', color: 'purple' },
    { icon: <Zap size={24} />, title: 'AI-Assisted Growth', desc: 'Our AI provides conceptual clarity, not just answers, to help you bridge understanding gaps.', color: 'emerald' },
    { icon: <ShieldCheck size={24} />, title: 'Expert Guidance', desc: 'Direct connection to verified mentors and industry professionals.', color: 'blue' }
  ];

  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* Hero Section */}
        <section className="mb-32 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 font-black text-xs uppercase tracking-widest mb-10">
            <Sparkles size={14} /> Our Vision & Mission
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.9]">
            Bridging the gap between <span className="text-indigo-500">Knowledge & Mastery.</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
            SkillBridge was born from a simple observation: the best teachers are often those who were students just yesterday. We're building the world's most intuitive peer-to-peer academic hub.
          </p>
        </section>

        {/* Values Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {values.map((v) => (
            <div key={v.title} className="bg-white/5 border border-white/10 p-10 rounded-[40px] hover:border-indigo-500/30 transition-all flex flex-col items-start gap-6">
              <div className={`w-14 h-14 rounded-2xl bg-${v.color}-500/10 flex items-center justify-center text-${v.color}-400`}>
                {v.icon}
              </div>
              <div>
                <h3 className="text-2xl font-black mb-4">{v.title}</h3>
                <p className="text-gray-500 font-bold leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Our Story */}
        <section className="bg-white/[0.03] border border-white/5 rounded-[50px] p-16 md:p-24 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-black mb-8 leading-tight">Our Journey</h2>
            <div className="space-y-6 text-gray-400 text-lg font-medium leading-relaxed">
              <p>
                Started by a group of passionate developers and educators, SkillBridge is designed to solve the isolation of modern online learning. 
              </p>
              <p>
                By combining AI precision with human empathy, we create a space where asking a doubt isn't just an action—it's the first step toward true mastery. Today, we're proud to serve thousands of learners globally.
              </p>
            </div>
            <Link href="/careers" className="inline-flex items-center gap-2 mt-12 bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black hover:bg-indigo-500 transition-all">
               Join Our Team <ArrowRight size={20} />
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
