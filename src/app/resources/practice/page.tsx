import { Metadata } from 'next';
import { Users, ArrowLeft, Trophy, Code2, Users2, Rocket, Timer } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Practice Hub | SkillBridge Academy',
  description: 'Join peer challenges and collaborative coding sessions in the SkillBridge Practice Hub.',
};

export default function PracticePage() {
  const challenges = [
    {
      title: 'Weekly Sprint',
      icon: <Timer size={24} />,
      diff: 'Expert',
      participants: 128
    },
    {
      title: 'Frontend Mastery',
      icon: <Code2 size={24} />,
      diff: 'Intermediate',
      participants: 540
    },
    {
      title: 'Algorithm Duel',
      icon: <Trophy size={24} />,
      diff: 'Hard',
      participants: 89
    },
    {
      title: 'Collaborative Build',
      icon: <Users2 size={24} />,
      diff: 'Group',
      participants: 32
    }
  ];

  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/resources" className="inline-flex items-center gap-2 text-rose-400 font-bold mb-12 hover:text-rose-300 transition-all">
          <ArrowLeft size={16} /> Back to Resources
        </Link>
        
        <header className="mb-20">
          <div className="inline-flex items-center gap-2 text-rose-500 mb-6">
            <Users size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Peer Challenges</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
            Practice <span className="text-rose-500">Hub.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed font-medium">
            Mastery comes from practice. Join real-time peer coding challenges and level up your skills in a competitive yet collaborative environment.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {challenges.map((challenge) => (
            <div key={challenge.title} className="bg-white/5 border border-white/10 p-10 rounded-[40px] hover:border-rose-500/30 transition-all group">
               <div className="flex justify-between items-start mb-12">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                    {challenge.icon}
                  </div>
                  <span className="px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] font-black uppercase text-rose-400">
                     {challenge.diff}
                  </span>
               </div>
               <h3 className="text-2xl font-black mb-2">{challenge.title}</h3>
               <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                  <Users size={14} /> {challenge.participants} competitors active
               </div>
               <button className="w-full mt-10 py-5 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-500 transition-all flex items-center justify-center gap-2">
                  Enter Challenge <Rocket size={20} />
               </button>
            </div>
          ))}
        </div>

        <section className="bg-gradient-to-br from-rose-600 to-rose-900 rounded-[50px] p-16 text-center text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
           <h2 className="text-4xl font-black mb-6 relative z-10">Global Leaderboard</h2>
           <p className="text-rose-100 text-lg mb-10 max-w-2xl mx-auto font-medium relative z-10">
              Climb the ranks by solving problems and helping peers. The top contributors get featured in our Talent Spotlight.
           </p>
           <button className="bg-white text-rose-600 px-12 py-5 rounded-[24px] font-black hover:scale-105 transition-all shadow-xl relative z-10">
              View Leaderboard
           </button>
        </section>
      </div>
    </main>
  );
}
