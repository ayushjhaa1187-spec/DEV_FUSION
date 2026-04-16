import { Metadata } from 'next';
import { ShieldCheck, ArrowRight, BookOpen, Users, Brain, Target } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Corporate Training | SkillBridge Academy',
  description: 'Empower your team with SkillBridge specialized corporate training and mentorship programs.',
};

export default function TrainingPage() {
  const solutions = [
    { icon: <Brain size={20} />, title: 'Skill Upskilling', desc: 'Customized curriculums focusing on modern tech stacks.' },
    { icon: <Users size={20} />, title: 'Team Mentorship', desc: 'Direct access to senior mentors for your engineering teams.' },
    { icon: <Target size={20} />, title: 'Skill Gap Analysis', desc: 'AI-driven identification of team knowledge gaps.' },
    { icon: <ShieldCheck size={20} />, title: 'Certification Hub', desc: 'Official SkillBridge certifications for industry recognized growth.' }
  ];

  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-20 text-center">
          <div className="inline-flex items-center gap-2 text-emerald-500 mb-6 font-bold">
            <BookOpen size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Institutional Solutions</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            Enterprise <span className="text-emerald-500">Learning.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed font-medium max-w-2xl mx-auto">
            Scale your team's knowledge with the world's most intuitive peer-to-peer and AI academic ecosystem.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 text-left">
           {solutions.map(solution => (
             <div key={solution.title} className="bg-white/5 border border-white/10 p-10 rounded-[40px] hover:border-emerald-500/20 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
                  {solution.icon}
                </div>
                <h3 className="text-2xl font-black mb-3">{solution.title}</h3>
                <p className="text-gray-500 font-bold leading-relaxed">{solution.desc}</p>
             </div>
           ))}
        </section>

        <section className="bg-emerald-600 rounded-[50px] p-20 text-white text-center">
          <h2 className="text-4xl font-black mb-6">Partner With Us</h2>
          <p className="text-emerald-100 text-lg mb-12 max-w-xl mx-auto font-medium">
            Contact our institutional hub to discuss customized training plans for your organization.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-emerald-600 px-12 py-5 rounded-[24px] font-black hover:scale-105 transition-all shadow-xl">
            Contact Sales <ArrowRight size={20} />
          </Link>
        </section>
      </div>
    </main>
  );
}
