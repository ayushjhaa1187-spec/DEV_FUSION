'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import './landing.css';

// ── COMPONENTS ──

const RotatingTagline = () => {
  const lines = [
    "Solve doubts faster.",
    "Learn from peers.",
    "Earn your reputation.",
    "Master your subjects."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % lines.length), 3000);
    return () => clearInterval(timer);
  }, [lines.length]);

  return (
    <div className="h-[1.2em] relative overflow-hidden flex justify-center">
      <AnimatePresence mode="wait">
        <motion.div
           key={index}
           initial={{ y: 40, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: -40, opacity: 0 }}
           transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
           className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400"
        >
          {lines[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const StatCounter = ({ value, label, suffix = "" }: { value: number, label: string, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const stepTime = Math.abs(Math.floor(duration / end));
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start >= end) clearInterval(timer);
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black mb-2 font-heading tracking-tighter">
        {count}{suffix}
      </div>
      <div className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</div>
    </div>
  );
};

class Particle {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  constructor(W: number, H: number) {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.2;
    this.vy = (Math.random() - 0.5) * 0.2;
  }
  update(W: number, H: number) {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number, particles: Particle[] = [];
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 100; i++) particles.push(new Particle(W, H));

    const anim = () => {
      ctx.clearRect(0,0,W,H);
      particles.forEach(p => { p.update(W, H); p.draw(ctx); });
      requestAnimationFrame(anim);
    };
    anim();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-50 z-0" />;
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white selection:bg-indigo-500/30">
      <ParticleBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Stack Overflow, built for your college.
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-black font-heading mb-6 tracking-tight leading-[0.9]"
          >
            Bridge the Gap. <br />
            <RotatingTagline />
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl mb-12 leading-relaxed"
          >
            SkillBridge is the professional peer-learning network where curiosity meets resolution. 
            Post doubts, book experts, and build your academic equity.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
              Start Your Journey — It&apos;s Free
            </Link>
            <Link href="#features" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all active:scale-95">
              How it works
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Marquee Ticker */}
      <div className="marquee-container mb-24">
        <div className="marquee-content">
          {['React', 'DBMS', 'OS', 'CN', 'DSA', 'SQL', 'System Design', 'ML', 'Cloud'].map(tag => (
            <div key={tag} className="marquee-item">{tag}</div>
          ))}
          {/* Duplicate for seamless scroll */}
          {['React', 'DBMS', 'OS', 'CN', 'DSA', 'SQL', 'System Design', 'ML', 'Cloud'].map(tag => (
            <div key={tag} className="marquee-item">{tag}</div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-6 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-12 border-y border-white/5">
          <StatCounter value={10000} suffix="+" label="Doubts Solved" />
          <StatCounter value={500} suffix="+" label="Expert Mentors" />
          <StatCounter value={98} suffix="%" label="Resolution Rate" />
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 mb-32">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-black font-heading mb-4">Engineered for Students.</h2>
          <p className="text-gray-500 max-w-xl">A suite of powerful tools designed to accelerate your technical growth.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Width Bento Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 bg-gradient-to-br from-indigo-900/40 to-black p-12 rounded-[40px] border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
            <div className="relative z-10 max-w-xl">
              <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mb-4 block">Core Engine</span>
              <h3 className="text-4xl font-black font-heading mb-6">AI Doubt Solver</h3>
              <p className="text-gray-400 text-lg mb-8">
                Stuck on a conceptual roadblock? Our AI tutor provides instant logical breakdowns, code explanations, and step-by-step resolution.
              </p>
              <Link href="/doubts" className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:gap-4 transition-all">
                Try AI Solver now <span className="text-2xl">→</span>
              </Link>
            </div>
          </motion.div>

          {/* Half Width Cards */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#13132b] p-10 rounded-[40px] border border-white/5"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
               <Award size={24} />
            </div>
            <h3 className="text-2xl font-black font-heading mb-4">Reputation Score</h3>
            <p className="text-gray-400 leading-relaxed">
              Build your technical equity. Every answer you provide earns points that translate to profile trust and exclusive platform perks.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#13132b] p-10 rounded-[40px] border border-white/5"
          >
             <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                <Calendar size={24} />
             </div>
             <h3 className="text-2xl font-black font-heading mb-4">Expert Sessions</h3>
             <p className="text-gray-400 leading-relaxed">
               Book 1-on-1 live sessions with verified seniors and industry experts from your own college network for personalized guidance.
             </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 mb-32 text-center">
        <div className="bg-indigo-600 p-16 rounded-[60px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500 to-transparent opacity-50" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black font-heading mb-6 leading-none">Ready to bridge your skill gap?</h2>
            <p className="text-indigo-100 text-lg mb-12 opacity-80">Join 10,000+ students already growing on SkillBridge.</p>
            <Link href="/auth" className="inline-block bg-white text-indigo-600 px-12 py-5 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-2xl">
              Launch SkillBridge
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

const Award = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>;
const Calendar = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
