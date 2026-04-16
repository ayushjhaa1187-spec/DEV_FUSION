import { Metadata } from 'next';
import { BookOpen, ArrowLeft, Database, Search, ShieldCheck, Zap, Server } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DBMS Guide | SkillBridge Academy',
  description: 'Master Database Management Systems, from SQL fundamentals to NoSQL scalability.',
};

export default function DBMSPage() {
  const sections = [
    {
      title: 'Relational Model',
      icon: <Database size={24} />,
      desc: 'Master SQL, Joins, Indexing, and ACID properties.'
    },
    {
      title: 'NoSQL & Scaling',
      icon: <Zap size={24} />,
      desc: 'Understand CAP theorem, Base properties, and Document stores.'
    },
    {
      title: 'System Design',
      icon: <Server size={24} />,
      desc: 'Learn Sharding, Replication, and Cache management.'
    },
    {
      title: 'Data Security',
      icon: <ShieldCheck size={24} />,
      desc: 'Implement RBAC, Encryption at rest, and Data masking.'
    }
  ];

  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/resources" className="inline-flex items-center gap-2 text-blue-400 font-bold mb-12 hover:text-blue-300 transition-all">
          <ArrowLeft size={16} /> Back to Resources
        </Link>
        
        <header className="mb-20">
          <div className="inline-flex items-center gap-2 text-blue-500 mb-6">
            <Database size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">SQL & NoSQL</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
            DBMS <span className="text-blue-500">Mastery.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed font-medium">
            Databases are the memory of every application. From simple CRUD operations to complex distributed systems, we cover the entire spectrum of data persistence.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">
          {sections.map((section) => (
            <div key={section.title} className="p-1 w-full bg-gradient-to-br from-blue-500/20 to-transparent rounded-[32px]">
              <div className="bg-[#050505] p-10 rounded-[31px] h-full flex flex-col items-start gap-6 border border-white/5">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3">{section.title}</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">{section.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-white/[0.03] border border-white/10 rounded-[40px] p-12 overflow-hidden relative">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-black mb-6">Interactive SQL Laboratory</h2>
              <p className="text-gray-400 text-lg font-medium leading-relaxed mb-8">
                Run real queries against massive datasets in our sandbox environment. Test your indexing strategies in real-time.
              </p>
              <button className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-blue-500 transition-all flex items-center gap-2">
                Launch Sandbox <Search size={20} />
              </button>
            </div>
            <div className="w-full md:w-72 aspect-square bg-blue-600/10 rounded-full flex items-center justify-center animate-pulse">
               <Database size={80} className="text-blue-500" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
