import { Metadata } from 'next';
import { Target, ArrowLeft, BookOpen, Code2, Layers, Cpu } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DSA Roadmap | SkillBridge Academy',
  description: 'Master Data Structures and Algorithms with our curated prep guide and cheat sheet.',
};

export default function DSAPage() {
  const topics = [
    {
      title: 'Foundation',
      icon: <Layers size={20} />,
      color: 'purple',
      items: ['Arrays & Strings', 'Linked Lists', 'Stacks & Queues', 'Hashing Fundamentals']
    },
    {
      title: 'Algorithms',
      icon: <Cpu size={20} />,
      color: 'green',
      items: ['Searching (Binary Search)', 'Sorting (Merge/Quick Sort)', 'Recursion & Backtracking']
    },
    {
      title: 'Advanced Data Structures',
      icon: <Code2 size={20} />,
      color: 'blue',
      items: ['Trees (BST, AVL)', 'Heaps', 'Graphs (BFS/DFS)', 'Tries']
    },
    {
      title: 'Problem Solving',
      icon: <Target size={20} />,
      color: 'red',
      items: ['Dynamic Programming', 'Greedy Algorithms', 'Sliding Window', 'Two Pointers']
    }
  ];

  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/resources" className="inline-flex items-center gap-2 text-indigo-400 font-bold mb-12 hover:text-indigo-300 transition-all">
          <ArrowLeft size={16} /> Back to Resources
        </Link>
        
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 text-indigo-500 mb-6">
            <BookOpen size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Prep Guide</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
            DSA <span className="text-indigo-500">Roadmap.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed font-medium">
            Data Structures and Algorithms are the backbone of efficient software. This guide covers everything from the basics of Big-O complexity to advanced graph theory.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {topics.map((topic, idx) => (
            <div key={topic.title} className="bg-white/5 border border-white/10 p-8 rounded-[32px] hover:border-indigo-500/30 transition-all">
              <div className={`w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6`}>
                {topic.icon}
              </div>
              <h3 className="text-2xl font-black mb-4">{topic.title}</h3>
              <ul className="space-y-3">
                {topic.items.map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-400 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="bg-indigo-600 rounded-[40px] p-12 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Start Practicing Today</h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto font-medium">
            Knowledge is only half the battle. Implement these structures in our Practice Hub to truly master them.
          </p>
          <Link href="/resources/practice" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all">
            Open Practice Hub <Code2 size={20} />
          </Link>
        </section>
      </div>
    </main>
  );
}
