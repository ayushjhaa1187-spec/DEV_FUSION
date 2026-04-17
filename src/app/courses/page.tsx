import { Metadata } from 'next';
import { BookOpen, Code, Brain, Globe, Shield, Database, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Courses | SkillBridge Academy',
  description: 'Explore our catalog of peer-led courses and AI-assisted learning paths.',
};

export default function CoursesPage() {
  const categories = [
    { 
      title: 'Computer Science', 
      icon: <Code size={24} />, 
      color: 'indigo',
      courses: ['Data Structures', 'Algorithms', 'System Design', 'Operating Systems']
    },
    { 
      title: 'Artificial Intelligence', 
      icon: <Brain size={24} />, 
      color: 'emerald',
      courses: ['Machine Learning', 'Neural Networks', 'NLP', 'Computer Vision']
    },
    { 
      title: 'Infrastructure', 
      icon: <Database size={24} />, 
      color: 'amber',
      courses: ['Database Management', 'Cloud Computing', 'Cybersecurity', 'DevOps']
    },
    { 
      title: 'Humanities', 
      icon: <Globe size={24} />, 
      color: 'rose',
      courses: ['Business Strategy', 'Digital Marketing', 'Public Speaking', 'Design Thinking']
    }
  ];

  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', background: '#09090b', color: '#fff' }}>
      
      {/* Search & Header Section */}
      <section className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
              <BookOpen size={14} />
              <span>Full Catalog</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-none">
              Master any <span className="text-indigo-500">Skill.</span>
            </h1>
            <p className="text-xl text-gray-400 font-medium">
              Join 50,000+ students learning through peer collaboration and AI-powered conceptual breakdowns.
            </p>
          </div>
          
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat) => (
            <div key={cat.title} className="group relative bg-white/5 border border-white/10 rounded-[40px] p-10 overflow-hidden hover:border-indigo-500/30 transition-all duration-500">
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-${cat.color}-500/10 flex items-center justify-center text-${cat.color}-400 mb-8 border border-${cat.color}-500/20`}>
                  {cat.icon}
                </div>
                <h2 className="text-3xl font-black mb-6">{cat.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cat.courses.map(course => (
                    <Link 
                      href={`/tests?target=${course.toLowerCase().replace(/ /g, '-')}`} 
                      key={course}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all group/item"
                    >
                      <div>
                        <span className="block font-bold text-gray-300 group-hover/item:text-white transition-colors">{course}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 group-hover/item:text-indigo-300">Take Final Exam</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-600 group-hover/item:text-indigo-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Decorative background glow */}
              <div className={`absolute -right-20 -top-20 w-64 h-64 bg-${cat.color}-600/10 blur-[100px] rounded-full group-hover:bg-${cat.color}-600/20 transition-all duration-700`} />
            </div>
          ))}
        </div>
      </section>

      {/* Trust Banner */}
      <section className="border-t border-white/5 py-20 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs mb-10">Trusted by students from</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-2xl font-black italic">TECH-U</span>
            <span className="text-2xl font-black italic">GLOBAL-INST</span>
            <span className="text-2xl font-black italic">FUTURE-LABS</span>
            <span className="text-2xl font-black italic">CODE-FOUNDRY</span>
          </div>
        </div>
      </section>
    </main>
  );
}
