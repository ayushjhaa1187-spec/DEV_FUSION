'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import './landing.css';

// ── PARTICLE CANVAS COMPONENT ──
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number, particles: Particle[] = [], mouse = { x: -999, y: -999 };

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    class Particle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      r: number = 0;
      color: string = '';
      alpha: number = 0;

      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.r = Math.random() * 2 + 0.5;
        const hues = ['124,58,237', '6,214,160', '245,158,11', '99,102,241'];
        this.color = hues[Math.floor(Math.random() * hues.length)];
        this.alpha = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        const dx = this.x - mouse.x, dy = this.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          this.x += dx / d * 1.2;
          this.y += dy / d * 1.2;
        }
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
      }
      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 120; i++) particles.push(new Particle());

    function drawLines() {
      if (!ctx) return;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124,58,237,${0.15 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
      drawLines();
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef} />;
};

export default function HomePage() {
  const [counts, setCounts] = useState({ doubts: 0, mentors: 0, points: 0 });
  const targets = { doubts: 4800, mentors: 320, points: 12600 };

  useEffect(() => {
    // Scroll Reveal
    const revObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

    // Counter Animation
    const statsObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const duration = 2000;
          const frameRate = 1000 / 60;
          const totalFrames = duration / frameRate;
          let frame = 0;

          const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            setCounts({
              doubts: Math.floor(targets.doubts * progress),
              mentors: Math.floor(targets.mentors * progress),
              points: Math.floor(targets.points * progress)
            });
            if (frame >= totalFrames) clearInterval(timer);
          }, frameRate);
          statsObs.disconnect();
        }
      });
    }, { threshold: 0.3 });

    const statsEl = document.querySelector('.hero-stats');
    if (statsEl) statsObs.observe(statsEl);

    return () => {
      revObs.disconnect();
      statsObs.disconnect();
    };
  }, []);

  return (
    <>
      <ParticleBackground />

      {/* NAVBAR */}
      <nav className="navbar glass">
        <Link href="/" className="logo">
          <svg className="logo-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06d6a0" />
              </linearGradient>
            </defs>
            <path d="M4 28 Q20 8 36 28" stroke="url(#lg1)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <line x1="4" y1="28" x2="36" y2="28" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="13" y1="20" x2="13" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            <line x1="27" y1="20" x2="27" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="10.5" r="3" fill="#06d6a0" opacity=".9" />
          </svg>
          <span className="logo-text">Skill<span>Bridge</span></span>
        </Link>
        <ul className="nav-links">
          <li><Link href="/doubts">Doubts</Link></li>
          <li><Link href="/mentors">Mentors</Link></li>
          <li><Link href="/tests">Practice</Link></li>
          <li><Link href="/profile">Profile</Link></li>
        </ul>
        <Link href="/auth" className="nav-cta">Get Started Free →</Link>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div>
          <div className="hero-badge">
            <div className="dot"></div>
            Now live · Powered by Gemini AI
          </div>
          <h1>Bridge the Gap.<br /><span className="grad">Learn. Earn. Grow.</span></h1>
          <p className="tagline">SkillBridge turns your <strong>academic doubts</strong> into answered questions, your <strong>knowledge</strong> into reputation, and your <strong>goals</strong> into mentored reality.</p>
          <div className="hero-btns">
            <Link href="/auth" className="btn-primary">Start for Free</Link>
            <Link href="#features" className="btn-ghost">See how it works ↓</Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-num">{counts.doubts.toLocaleString()}+</div>
              <div className="stat-label">Doubts Solved</div>
            </div>
            <div className="stat">
              <div className="stat-num">{counts.mentors.toLocaleString()}+</div>
              <div className="stat-label">Expert Mentors</div>
            </div>
            <div className="stat">
              <div className="stat-num">{counts.points.toLocaleString()}+</div>
              <div className="stat-label">Reputation Points</div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker">
          <span className="ticker-item">🧠 AI Doubt Solver <span>LIVE</span></span>
          <span className="ticker-item">⚡ Real-time Answers <span>NEW</span></span>
          <span className="ticker-item">🏆 Reputation Leaderboard <span>HOT</span></span>
          <span className="ticker-item">📚 AI Practice Tests <span>BETA</span></span>
          <span className="ticker-item">🎓 Book Expert Mentors <span>LIVE</span></span>
          <span className="ticker-item">🧠 AI Doubt Solver <span>LIVE</span></span>
          <span className="ticker-item">⚡ Real-time Answers <span>NEW</span></span>
          <span className="ticker-item">🏆 Reputation Leaderboard <span>HOT</span></span>
          <span className="ticker-item">📚 AI Practice Tests <span>BETA</span></span>
          <span className="ticker-item">🎓 Book Expert Mentors <span>LIVE</span></span>
        </div>
      </div>

      {/* FEATURES */}
      <section className="section reveal" id="features">
        <div className="section-label">Platform Pillars</div>
        <h2>Everything you need to<br /><em>level up academically</em></h2>
        <p className="sub">Built for students who demand more than passive learning.</p>
        <div className="features-grid">
          <div className="feat-card" style={{ ['--card-glow' as any]: 'rgba(124,58,237,.15)', ['--card-border' as any]: 'rgba(124,58,237,.5)', ['--card-shadow' as any]: 'rgba(124,58,237,.2)' }}>
            <div className="feat-icon" style={{ background: 'rgba(124,58,237,.15)' }}>🧠</div>
            <h3>AI Doubt Solver</h3>
            <p>Gemini-powered instant hints on any academic doubt. Ask first, get unstuck fast — then let the community deepen the answer.</p>
          </div>
          <div className="feat-card" style={{ ['--card-glow' as any]: 'rgba(6,214,160,.12)', ['--card-border' as any]: 'rgba(6,214,160,.4)', ['--card-shadow' as any]: 'rgba(6,214,160,.15)' }}>
            <div className="feat-icon" style={{ background: 'rgba(6,214,160,.12)' }}>🏆</div>
            <h3>Reputation Economy</h3>
            <p>Earn points for every accepted answer, climb the leaderboard, and unlock mentor privileges — all enforced by secure database triggers.</p>
          </div>
          <div className="feat-card" style={{ ['--card-glow' as any]: 'rgba(245,158,11,.12)', ['--card-border' as any]: 'rgba(245,158,11,.4)', ['--card-shadow' as any]: 'rgba(245,158,11,.15)' }}>
            <div className="feat-icon" style={{ background: 'rgba(245,158,11,.12)' }}>📚</div>
            <h3>AI Practice Engine</h3>
            <p>Generate 10-question MCQ tests on any subject, scored in real-time with instant reputation awards for top performance.</p>
          </div>
          <div className="feat-card" style={{ ['--card-glow' as any]: 'rgba(239,68,68,.12)', ['--card-border' as any]: 'rgba(239,68,68,.4)', ['--card-shadow' as any]: 'rgba(239,68,68,.15)' }}>
            <div className="feat-icon" style={{ background: 'rgba(239,68,68,.12)' }}>🔔</div>
            <h3>Real-time Notifications</h3>
            <p>Supabase Realtime pushes live updates to your notification bell the moment someone answers your doubt or books your session.</p>
          </div>
          <div className="feat-card" style={{ ['--card-glow' as any]: 'rgba(99,102,241,.12)', ['--card-border' as any]: 'rgba(99,102,241,.4)', ['--card-shadow' as any]: 'rgba(99,102,241,.15)' }}>
            <div className="feat-icon" style={{ background: 'rgba(99,102,241,.12)' }}>🎓</div>
            <h3>Expert Mentors</h3>
            <p>Browse verified mentors, pick a live slot from their calendar, and pay securely — from sandbox Razorpay to production in one config change.</p>
          </div>
          <div className="feat-card" style={{ ['--card-glow' as any]: 'rgba(236,72,153,.12)', ['--card-border' as any]: 'rgba(236,72,153,.4)', ['--card-shadow' as any]: 'rgba(236,72,153,.15)' }}>
            <div className="feat-icon" style={{ background: 'rgba(236,72,153,.12)' }}>🔒</div>
            <h3>Row-Level Security</h3>
            <p>Every row in every table is protected by Supabase RLS policies. Your data is yours, and impersonation attacks are structurally impossible.</p>
          </div>
        </div>
      </section>

      {/* FLASHCARDS */}
      <section className="section reveal" id="flashcards">
        <div className="section-label">Practice Mode</div>
        <h2>Flashcards that <em>glow</em><br />with every answer</h2>
        <p className="sub">Click to flip. Study smarter with AI-generated question decks.</p>
        <div className="flashcards">
          <Flashcard 
            tag="Data Structures" 
            q="What is the time complexity of binary search on a sorted array?" 
            a="O(log n) — each step halves the search space, making it extremely efficient for large datasets."
            className="fc1"
          />
          <Flashcard 
            tag="Operating Systems" 
            q="Explain the difference between a process and a thread." 
            a="A process is an independent program in execution with its own memory space. A thread is a lightweight unit sharing memory."
            className="fc2"
          />
          <Flashcard 
            tag="Machine Learning" 
            q="What does the learning rate control in gradient descent?" 
            a="The step size for parameter updates. Too high → divergence; too low → slow convergence."
            className="fc3"
          />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section reveal" id="mentors">
        <div className="section-label">Student Stories</div>
        <h2>What our community<br /><em>is saying</em></h2>
        <p className="sub">Real students. Real results. Real reputation points.</p>
        <div className="testimonials-grid">
          <TestimonialCard 
            stars="★★★★★"
            body="Posted a doubt on dynamic programming at 11 PM. Got an AI hint within seconds and a full community answer by midnight. Cleared my exam the next day."
            name="Riya Sharma"
            role="B.Tech CSE, IIT Delhi · 420 pts"
            avatar="R"
            colors={['#7c3aed33', '#06d6a033']}
            avatarGrad="linear-gradient(135deg,#7c3aed,#06d6a0)"
          />
          <TestimonialCard 
            stars="★★★★★"
            body="The AI MCQ generator gave me a custom Operating Systems test in 5 seconds. It felt like having a personal professor available 24/7 before placements."
            name="Arjun Mehta"
            role="MCA Final Year · 890 pts"
            avatar="A"
            colors={['#f59e0b33', '#ef444433']}
            avatarGrad="linear-gradient(135deg,#f59e0b,#ef4444)"
          />
          <TestimonialCard 
            stars="★★★★★"
            body="I became a mentor on SkillBridge and earned ₹4,200 in my first month just from weekend sessions. The booking system is seamless and payments hit instantly."
            name="Priya Nair"
            role="Software Engineer · Top Mentor 🏆"
            avatar="P"
            colors={['#06d6a033', '#6366f133']}
            avatarGrad="linear-gradient(135deg,#06d6a0,#6366f1)"
          />
          <TestimonialCard 
            stars="★★★★★"
            body="The reputation system changed how I study. Knowing my answers get scored pushes me to research deeply. My profile now shows 'Expert Resolver' — first in my batch."
            name="Karan Joshi"
            role="Data Science IIT Madras · 1,240 pts"
            avatar="K"
            colors={['#ec489933', '#7c3aed33']}
            avatarGrad="linear-gradient(135deg,#ec4899,#7c3aed)"
          />
        </div>
      </section>

      {/* BLOGS */}
      <section className="section reveal" id="blogs">
        <div className="section-label">Knowledge Base</div>
        <h2>From the <em>SkillBridge</em><br />learning blog</h2>
        <p className="sub">Insights for students, by students and mentors.</p>
        <div className="blogs-grid">
          <BlogCard 
            icon="🧠" 
            tag="AI + Learning" 
            title="How Gemini AI Generates Exam-Quality MCQs in Under 3 Seconds" 
            meta="Apr 2026 · 5 min read"
            bg="linear-gradient(135deg,#1e1b4b,#312e81)"
          />
          <BlogCard 
            icon="🏆" 
            tag="Community" 
            title="The Reputation Economy: Why Points Matter More Than Marks" 
            meta="Apr 2026 · 4 min read"
            bg="linear-gradient(135deg,#064e3b,#065f46)"
          />
          <BlogCard 
            icon="🎓" 
            tag="Mentorship" 
            title="From Student to Mentor: Earning ₹5K/Month on SkillBridge" 
            meta="Mar 2026 · 6 min read"
            bg="linear-gradient(135deg,#451a03,#78350f)"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section reveal">
        <div className="cta-blob"></div>
        <h2>Ready to bridge<br />your skill gap?</h2>
        <p>Join 4,800+ students already growing on SkillBridge. Free forever for learners.</p>
        <Link href="/auth" className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 3rem' }}>Start Learning Free →</Link>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-copy">© 2026 SkillBridge · Built at DEV_FUSION Hackathon 🚀</div>
        <div className="footer-links">
          <Link href="#">Privacy</Link>
          <Link href="#">Terms</Link>
          <Link href="https://github.com/ayushjhaa1187-spec/DEV_FUSION" target="_blank">GitHub</Link>
        </div>
      </footer>
    </>
  );
}

// ── SUB-COMPONENTS ──

const Flashcard = ({ tag, q, a, className }: any) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div 
      className={`flashcard ${className}`} 
      style={{ transform: flipped ? 'rotateY(180deg)' : '' }}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="fc-glow"></div>
      {!flipped ? (
        <>
          <div className="fc-tag">💜 {tag}</div>
          <div className="fc-q">{q}</div>
        </>
      ) : (
        <div className="fc-a" style={{ transform: 'rotateY(180deg)' }}>{a}</div>
      )}
    </div>
  );
};

const TestimonialCard = ({ stars, body, name, role, avatar, colors, avatarGrad }: any) => (
  <div className="testi-card" style={{ ['--t-color1' as any]: colors[0], ['--t-color2' as any]: colors[1] }}>
    <div className="stars">{stars}</div>
    <p className="testi-body">"{body}"</p>
    <div className="testi-user">
      <div className="testi-avatar" style={{ background: avatarGrad }}>{avatar}</div>
      <div>
        <div className="testi-name">{name}</div>
        <div className="testi-role">{role}</div>
      </div>
    </div>
  </div>
);

const BlogCard = ({ icon, tag, title, meta, bg }: any) => (
  <div className="blog-card">
    <div className="blog-thumb" style={{ background: bg }}>{icon}</div>
    <div className="blog-body">
      <div className="blog-tag">{tag}</div>
      <div className="blog-title">{title}</div>
      <div className="blog-meta">{meta}</div>
    </div>
  </div>
);
