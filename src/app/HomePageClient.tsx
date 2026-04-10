'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import './landing.css';

// ── PARTICLE CANVAS LOGIC ──
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; color: string; alpha: number; reset: () => void; update: () => void; draw: () => void }[] = [];
    let mouse = { x: -999, y: -999 };
    let animId: number;

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const onMouse = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouse);

    const hues = ['124,58,237', '6,214,160', '245,158,11', '99,102,241'];

    function createParticle() {
      const p = {
        x: 0, y: 0, vx: 0, vy: 0, r: 0, color: '', alpha: 0,
        reset() {
          this.x = Math.random() * W;
          this.y = Math.random() * H;
          this.vx = (Math.random() - 0.5) * 0.4;
          this.vy = (Math.random() - 0.5) * 0.4;
          this.r = Math.random() * 2 + 0.5;
          this.color = hues[Math.floor(Math.random() * hues.length)];
          this.alpha = Math.random() * 0.5 + 0.2;
        },
        update() {
          this.x += this.vx;
          this.y += this.vy;
          const dx = this.x - mouse.x, dy = this.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) { this.x += dx / d * 1.2; this.y += dy / d * 1.2; }
          if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
        },
        draw() {
          ctx!.beginPath();
          ctx!.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${this.color},${this.alpha})`;
          ctx!.fill();
        }
      };
      p.reset();
      return p;
    }

    for (let i = 0; i < 120; i++) particles.push(createParticle());

    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(124,58,237,${0.15 * (1 - d / 120)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
      drawLines();
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} id="bg-canvas" />;
};

// ── COUNTER ANIMATION ──
function useCounterAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          el.querySelectorAll<HTMLElement>('[data-target]').forEach(numEl => {
            const target = parseInt(numEl.dataset.target || '0');
            let cur = 0;
            const step = target / 80;
            const timer = setInterval(() => {
              cur += step;
              if (cur >= target) { cur = target; clearInterval(timer); }
              numEl.textContent = Math.floor(cur).toLocaleString() + (target > 999 ? '+' : '');
            }, 16);
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

// ── SCROLL REVEAL HOOK ──
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function HomePageClient() {
  const statsRef = useCounterAnimation();
  useScrollReveal();

  const tickerItems = [
    '🧠 AI Doubt Solver', '⚡ Real-time Answers', '🏆 Reputation Leaderboard',
    '📚 AI Practice Tests', '🎓 Book Expert Mentors', '💳 Payment Sandbox', '🔔 Real-time Notifications'
  ];
  const tickerLabels = ['LIVE', 'NEW', 'HOT', 'BETA', 'LIVE', 'READY', 'NEW'];

  return (
    <div style={{ background: 'var(--bg)' }}>
      <ParticleBackground />

      {/* ── LANDING NAVBAR ── */}
      <nav className="landing-nav">
        <Link href="/" className="landing-nav-logo">
          <svg className="landing-nav-logoIcon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="landingNavGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06d6a0" />
              </linearGradient>
            </defs>
            <path d="M4 28 Q20 8 36 28" stroke="url(#landingNavGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <line x1="4" y1="28" x2="36" y2="28" stroke="url(#landingNavGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="13" y1="20" x2="13" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            <line x1="27" y1="20" x2="27" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="10.5" r="3" fill="#06d6a0" opacity="0.9" />
            <circle cx="20" cy="10.5" r="5.5" fill="#06d6a0" opacity="0.2" />
          </svg>
          <span className="landing-nav-logoText">Skill<span>Bridge</span></span>
        </Link>
        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#flashcards" className="landing-nav-link">Practice</a>
          <a href="#mentors" className="landing-nav-link">Mentors</a>
        </div>
        <div className="landing-nav-actions">
          <Link href="/auth" className="landing-nav-signin">Sign In</Link>
          <Link href="/auth" className="landing-nav-cta">Get Started →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div>
          <div className="hero-badge">
            <div className="dot" />
            Now live · Powered by Gemini AI
          </div>
          <h1>Bridge the Gap.<br /><span className="grad">Learn. Earn. Grow.</span></h1>
          <p className="tagline">
            SkillBridge turns your <strong>academic doubts</strong> into answered questions, your{' '}
            <strong>knowledge</strong> into reputation, and your <strong>goals</strong> into mentored reality.
          </p>
          <div className="hero-btns">
            <Link href="/auth" className="btn-hero-primary">Start for Free</Link>
            <a href="#features" className="btn-ghost">See how it works ↓</a>
          </div>
          <div className="hero-stats" ref={statsRef}>
            <div className="stat"><div className="stat-num" data-target="4800">0</div><div className="stat-label">Doubts Solved</div></div>
            <div className="stat"><div className="stat-num" data-target="320">0</div><div className="stat-label">Expert Mentors</div></div>
            <div className="stat"><div className="stat-num" data-target="12600">0</div><div className="stat-label">Reputation Points Awarded</div></div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap">
        <div className="ticker">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span className="ticker-item" key={i}>
              {item} <span>{tickerLabels[i % tickerLabels.length]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="section reveal" id="features">
        <div className="section-label">Platform Pillars</div>
        <h2>Everything you need to<br /><em>level up academically</em></h2>
        <p className="sub">Built for students who demand more than passive learning.</p>
        <div className="features-grid">
          {[
            { icon: '🧠', title: 'AI Doubt Solver', desc: 'Gemini-powered instant hints on any academic doubt. Ask first, get unstuck fast — then let the community deepen the answer.', glow: 'rgba(124,58,237,.15)', border: 'rgba(124,58,237,.5)', shadow: 'rgba(124,58,237,.2)', iconBg: 'rgba(124,58,237,.15)' },
            { icon: '🏆', title: 'Reputation Economy', desc: 'Earn points for every accepted answer, climb the leaderboard, and unlock mentor privileges — all enforced by secure database triggers.', glow: 'rgba(6,214,160,.12)', border: 'rgba(6,214,160,.4)', shadow: 'rgba(6,214,160,.15)', iconBg: 'rgba(6,214,160,.12)' },
            { icon: '📚', title: 'AI Practice Engine', desc: 'Generate 10-question MCQ tests on any subject, scored in real-time with instant reputation awards for top performance.', glow: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.4)', shadow: 'rgba(245,158,11,.15)', iconBg: 'rgba(245,158,11,.12)' },
            { icon: '🔔', title: 'Real-time Notifications', desc: 'Supabase Realtime pushes live updates to your notification bell the moment someone answers your doubt or books your session.', glow: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.4)', shadow: 'rgba(239,68,68,.15)', iconBg: 'rgba(239,68,68,.12)' },
            { icon: '🎓', title: 'Expert Mentors', desc: 'Browse verified mentors, pick a live slot from their calendar, and pay securely — from sandbox Razorpay to production in one config change.', glow: 'rgba(99,102,241,.12)', border: 'rgba(99,102,241,.4)', shadow: 'rgba(99,102,241,.15)', iconBg: 'rgba(99,102,241,.12)' },
            { icon: '🔒', title: 'Row-Level Security', desc: 'Every row in every table is protected by Supabase RLS policies. Your data is yours, and impersonation attacks are structurally impossible.', glow: 'rgba(236,72,153,.12)', border: 'rgba(236,72,153,.4)', shadow: 'rgba(236,72,153,.15)', iconBg: 'rgba(236,72,153,.12)' },
          ].map((f, i) => (
            <div key={i} className="feat-card" style={{ '--card-glow': f.glow, '--card-border': f.border, '--card-shadow': f.shadow } as React.CSSProperties}>
              <div className="feat-icon" style={{ background: f.iconBg }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FLASHCARDS ── */}
      <section className="section reveal" id="flashcards">
        <div className="section-label">Practice Mode</div>
        <h2>Flashcards that <em>glow</em><br />with every answer</h2>
        <p className="sub">Hover to flip. Study smarter with AI-generated question decks.</p>
        <div className="flashcards">
          <div className="flashcard fc1">
            <div className="fc-glow" />
            <div className="fc-tag">💜 Data Structures</div>
            <div className="fc-q">What is the time complexity of binary search on a sorted array?</div>
            <div className="fc-a">O(log n) — each step halves the search space, making it extremely efficient for large datasets.</div>
          </div>
          <div className="flashcard fc2">
            <div className="fc-glow" />
            <div className="fc-tag">🟢 Operating Systems</div>
            <div className="fc-q">Explain the difference between a process and a thread.</div>
            <div className="fc-a">A process is an independent program in execution with its own memory space. A thread is a lightweight unit within a process sharing the same memory.</div>
          </div>
          <div className="flashcard fc3">
            <div className="fc-glow" />
            <div className="fc-tag">🟡 Machine Learning</div>
            <div className="fc-q">What does the learning rate control in gradient descent?</div>
            <div className="fc-a">The step size for parameter updates. Too high → divergence; too low → slow convergence. Adaptive optimizers like Adam manage this automatically.</div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section reveal" id="mentors">
        <div className="section-label">Student Stories</div>
        <h2>What our community<br /><em>is saying</em></h2>
        <p className="sub">Real students. Real results. Real reputation points.</p>
        <div className="testimonials-grid">
          {[
            { body: '"Posted a doubt on dynamic programming at 11 PM. Got an AI hint within seconds and a full community answer by midnight. Cleared my exam the next day."', name: 'Riya Sharma', role: 'B.Tech CSE, IIT Delhi · 420 pts', initial: 'R', grad: 'linear-gradient(135deg,#7c3aed,#06d6a0)', c1: '#7c3aed33', c2: '#06d6a033' },
            { body: '"The AI MCQ generator gave me a custom Operating Systems test in 5 seconds. It felt like having a personal professor available 24/7 before placements."', name: 'Arjun Mehta', role: 'MCA Final Year · 890 pts', initial: 'A', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', c1: '#f59e0b33', c2: '#ef444433' },
            { body: '"I became a mentor on SkillBridge and earned ₹4,200 in my first month just from weekend sessions. The booking system is seamless and payments hit instantly."', name: 'Priya Nair', role: 'Software Engineer · Top Mentor 🏆', initial: 'P', grad: 'linear-gradient(135deg,#06d6a0,#6366f1)', c1: '#06d6a033', c2: '#6366f133' },
            { body: '"The reputation system changed how I study. Knowing my answers get scored pushes me to research deeply. My profile now shows \'Expert Resolver\' — first in my batch."', name: 'Karan Joshi', role: 'Data Science IIT Madras · 1,240 pts', initial: 'K', grad: 'linear-gradient(135deg,#ec4899,#7c3aed)', c1: '#ec489933', c2: '#7c3aed33' },
          ].map((t, i) => (
            <div key={i} className="testi-card" style={{ '--t-color1': t.c1, '--t-color2': t.c2 } as React.CSSProperties}>
              <div className="stars">★★★★★</div>
              <p className="testi-body">{t.body}</p>
              <div className="testi-user">
                <div className="testi-avatar" style={{ background: t.grad }}>{t.initial}</div>
                <div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BLOGS ── */}
      <section className="section reveal" id="blogs">
        <div className="section-label">Knowledge Base</div>
        <h2>From the <em>SkillBridge</em><br />learning blog</h2>
        <p className="sub">Insights for students, by students and mentors.</p>
        <div className="blogs-grid">
          {[
            { emoji: '🧠', bg: 'linear-gradient(135deg,#1e1b4b,#312e81)', tag: 'AI + Learning', title: 'How Gemini AI Generates Exam-Quality MCQs in Under 3 Seconds', meta: 'Apr 2026 · 5 min read' },
            { emoji: '🏆', bg: 'linear-gradient(135deg,#064e3b,#065f46)', tag: 'Community', title: 'The Reputation Economy: Why Points Matter More Than Marks', meta: 'Apr 2026 · 4 min read' },
            { emoji: '🎓', bg: 'linear-gradient(135deg,#451a03,#78350f)', tag: 'Mentorship', title: 'From Student to Mentor: Earning ₹5K/Month on SkillBridge', meta: 'Mar 2026 · 6 min read' },
          ].map((b, i) => (
            <div key={i} className="blog-card">
              <div className="blog-thumb" style={{ background: b.bg }}>{b.emoji}</div>
              <div className="blog-body">
                <div className="blog-tag">{b.tag}</div>
                <div className="blog-title">{b.title}</div>
                <div className="blog-meta">{b.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section reveal">
        <div className="cta-blob" />
        <h2>Ready to bridge<br />your skill gap?</h2>
        <p>Join 4,800+ students already growing on SkillBridge. Free forever for learners.</p>
        <Link href="/auth" className="btn-hero-primary" style={{ fontSize: '1.1rem', padding: '1rem 3rem' }}>
          Start Learning Free →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-copy">© 2026 SkillBridge · Built at DEV_FUSION Hackathon 🚀</div>
        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="https://github.com/ayushjhaa1187-spec/DEV_FUSION" target="_blank" rel="noopener">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
