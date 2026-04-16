import { Metadata } from 'next';
import { ShieldCheck, ArrowLeft, Cookie, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | SkillBridge Academy',
  description: 'Learn about how we use cookies to improve your experience on SkillBridge.',
};

export default function CookiesPage() {
  const cookieTypes = [
    { title: 'Necessary', desc: 'Required for basic site functionality and authentication.' },
    { title: 'Analytical', desc: 'Allows us to understand how you interact with our platform.' },
    { title: 'Functional', desc: 'Remembers your preferences and personalization settings.' },
    { title: 'Security', desc: 'Protects your account and prevents fraudulent activity.' }
  ];

  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 font-bold mb-12 hover:text-indigo-300 transition-all">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 text-amber-500 mb-6 font-bold">
            <Cookie size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Privacy Preference</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Cookie Policy.
          </h1>
          <p className="text-gray-400 font-medium">Last Updated: April 16, 2026</p>
        </header>

        <section className="prose prose-invert max-w-none space-y-12">
          <p className="text-lg text-gray-400 font-bold leading-relaxed">
            SkillBridge Academy uses cookies and similar technologies to enhance your learning experience, provide essential functionality, and analyze site performance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {cookieTypes.map(type => (
               <div key={type.title} className="bg-white/5 border border-white/10 p-8 rounded-[32px]">
                  <h3 className="text-xl font-black mb-3 text-white">{type.title}</h3>
                  <p className="text-gray-500 font-bold leading-relaxed">{type.desc}</p>
               </div>
             ))}
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 p-10 rounded-[40px]">
             <h2 className="text-2xl font-black mb-6">Managing Your Cookies</h2>
             <p className="text-indigo-300 font-bold mb-8 leading-relaxed">
               Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.
             </p>
             <button className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-500 transition-all">
                Update Settings <ExternalLink size={18} />
             </button>
          </div>
        </section>
      </div>
    </main>
  );
}
