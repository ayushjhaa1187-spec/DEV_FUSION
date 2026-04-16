import { Metadata } from 'next';
import { BookOpen, ArrowLeft, Cpu, HardDrive, Shield, Activity } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Operating Systems | SkillBridge Academy',
  description: 'Understand the core concepts of Operating Systems, from Process Management to File Systems.',
};

export default function OSPage() {
  const categories = [
    {
      title: 'Process Management',
      icon: <Activity size={20} />,
      items: ['Scheduling Algorithms', 'Deadlocks & Prevention', 'Inter-process Communication', 'Threads & Concurrency']
    },
    {
      title: 'Memory Management',
      icon: <Cpu size={20} />,
      items: ['Paging & Segmentation', 'Virtual Memory', 'Cache Mapping', 'Page Replacement Algorithms']
    },
    {
      title: 'Storage Systems',
      icon: <HardDrive size={20} />,
      items: ['File System Structure', 'Disk Scheduling (SSTF, SCAN)', 'RAID Configurations', 'I/O Hardware']
    },
    {
      title: 'Security & Protection',
      icon: <Shield size={20} />,
      items: ['System Calls', 'Authentication & Access', 'Memory Protection', 'Kernel vs User Mode']
    }
  ];

  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/resources" className="inline-flex items-center gap-2 text-indigo-400 font-bold mb-12 hover:text-indigo-300 transition-all">
          <ArrowLeft size={16} /> Back to Resources
        </Link>
        
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 text-emerald-500 mb-6">
            <BookOpen size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Core Knowledge</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
            Operating <span className="text-emerald-500">Systems.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed font-medium">
            Learn how deep-level software manages hardware resources and provides services for computer programs. A must-know for full-stack developers.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {categories.map((cat) => (
            <div key={cat.title} className="bg-white/5 border border-white/10 p-10 rounded-[40px] hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  {cat.icon}
                </div>
                <h3 className="text-2xl font-black">{cat.title}</h3>
              </div>
              <ul className="grid grid-cols-1 gap-4">
                {cat.items.map(item => (
                  <li key={item} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-gray-400 font-bold group-hover:text-gray-200 transition-colors">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-emerald-600 rounded-[40px] p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black mb-2">Deep Dive into Architecture</h2>
            <p className="text-emerald-100 font-medium">Join our advanced labs to simulate kernel-level process scheduling.</p>
          </div>
          <button className="bg-white text-emerald-700 px-10 py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-xl">
            Join Advanced Lab
          </button>
        </div>
      </div>
    </main>
  );
}
