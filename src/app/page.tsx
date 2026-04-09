'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '@/components/layout/Footer';
import { CountUp } from '@/components/ui/CountUp';
import './landing.css';

// ── PARTICLE CANVAS LOGIC (Internal Component) ──
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
      glow: string = '';

      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.r = Math.random() * 1.5 + 0.8;
        const hues = ['124,58,237', '6,214,160', '245,158,11', '139,92,246'];
        const choice = Math.floor(Math.random() * hues.length);
        this.color = hues[choice];
        this.glow = `rgba(${hues[choice]}, 0.5)`;
        this.alpha = Math.random() * 0.4 + 0.3;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Subtle repulsion from mouse
        const mdx = this.x - mouse.x;
        const mdy = this.y - mouse.y;
        const dist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (dist < 150) {
          this.x += (mdx / dist) * 0.5;
          this.y += (mdy / dist) * 0.5;
        }

        if (this.x < -20) this.x = W + 20;
        if (this.x > W + 20) this.x = -20;
        if (this.y < -20) this.y = H + 20;
        if (this.y > H + 20) this.y = -20;
      }
      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        
        // Add neon glow to nodes
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.glow;
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.fill();
        ctx.restore();
      }
    }

    // Increased density for premium feel
    const count = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 9000), 180);
    for (let i = 0; i < count; i++) particles.push(new Particle());

    function drawLines() {
      if (!ctx) return;
      
      // 1. Connect particles to each other (Spider Web)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dSq = dx * dx + dy * dy;
          
          if (dSq < 14400) { // 120px
            const dist = Math.sqrt(dSq);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const lineAlpha = (1 - dist / 120) * 0.2;
            ctx.strokeStyle = `rgba(124,58,237, ${lineAlpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }

        // 2. ACTIVE WEBBING: Connect particles to Mouse Cursor (Dynamic Web)
        const mouseDx = particles[i].x - mouse.x;
        const mouseDy = particles[i].y - mouse.y;
        const mouseDistSq = mouseDx * mouseDx + mouseDy * mouseDy;
        
        if (mouseDistSq < 40000) { // 200px radius for mouse webbing
          const mDist = Math.sqrt(mouseDistSq);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          const mAlpha = (1 - mDist / 200) * 0.35;
          ctx.strokeStyle = `rgba(6,214,160, ${mAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
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
      // Clean up mouse listener would be ideal but browser event listeners stay active
    };
  }, []);

  // High-performance background particles with mouse interaction
  return <canvas id="bg-canvas" ref={canvasRef} style={{ pointerEvents: 'none' }} />;
};

export default function HomePage() {
  return (
    <main className="sb-page">
      <ParticleBackground />

      <nav className="sb-nav">
        <Link href="/" className="sb-logo">
          <svg
            className="sb-logoIcon"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="SkillBridge logo"
          >
            <defs>
              <linearGradient id="sbLogoGrad" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06d6a0" />
              </linearGradient>
            </defs>
            <path
              d="M4 28 Q20 8 36 28"
              stroke="url(#sbLogoGrad)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <line
              x1="4"
              y1="28"
              x2="36"
              y2="28"
              stroke="url(#sbLogoGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line x1="13" y1="20" x2="13" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            <line x1="27" y1="20" x2="27" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="10.5" r="3" fill="#06d6a0" opacity=".95" />
            <circle cx="20" cy="10.5" r="6" fill="#06d6a0" opacity=".18" />
          </svg>
          <span className="sb-logoText">
            Skill<span>Bridge</span>
          </span>
        </Link>

        <div className="sb-navLinks">
          <Link href="/doubts">Doubts</Link>
          <Link href="/mentors">Mentors</Link>
          <Link href="/tests">Practice</Link>
          <Link href="/dashboard/progress">My Progress</Link>
          <Link href="/dashboard/sessions">Live Sessions</Link>
        </div>

        <Link href="/auth" className="sb-navCta">
          Get Started
        </Link>
      </nav>

      <section className="sb-hero">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="sb-heroBadge"
        >
          <span className="sb-badgeDot" />
          AI-powered student growth platform
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="sb-title"
        >
          Bridge the Gap.
          <br />
          <span>Learn. Earn. Grow.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="sb-subtitle"
        >
          Get doubts solved, practice smarter with AI, build reputation, and book expert mentors — all in one
          premium student platform.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="sb-actions"
        >
          <Link href="/auth" className="sb-btnPrimary">
            Start Free
          </Link>
          <Link href="#features" className="sb-btnGhost">
            Explore Platform
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="sb-stats"
        >
          <div>
            <CountUp to={4.8} suffix="K+" duration={2} />
            <span>Doubts solved</span>
          </div>
          <div>
            <CountUp to={320} suffix="+" duration={2} />
            <span>Mentors onboard</span>
          </div>
          <div>
            <CountUp to={12.6} suffix="K+" duration={2} />
            <span>Points earned</span>
          </div>
        </motion.div>
      </section>

      <section id="features" className="sb-section">
        <div className="sb-sectionHead sb-stagger-1">
          <p>Platform highlights</p>
          <h2>Flash-card glow. Live reactions. Premium motion.</h2>
        </div>

        <div className="sb-cards sb-stagger-2">
          <article className="sb-card purple">
            <div className="sb-cardGlow" />
            <h3>AI Doubt Solver</h3>
            <p>Instant hints and structured explanations powered by Gemini.</p>
          </article>

          <article className="sb-card green">
            <div className="sb-cardGlow" />
            <h3>Reputation System</h3>
            <p>Earn points automatically when your answers help others.</p>
          </article>

          <article className="sb-card gold">
            <div className="sb-cardGlow" />
            <h3>Practice Engine</h3>
            <p>Generate tests, answer quickly, and see polished score feedback.</p>
          </article>
        </div>

        <div className="sb-flashRow sb-stagger-3">
          {[
            { tag: 'Data Structures', q: 'What is the complexity of binary search?', a: 'O(log n), because the search space halves at every step.', color: 'purple' },
            { tag: 'Operating Systems', q: 'Process vs thread?', a: 'A process owns memory; threads share a process memory space.', color: 'green' },
            { tag: 'Machine Learning', q: 'What does learning rate control?', a: 'It controls how large each optimization step is during training.', color: 'gold' }
          ].map((card, i) => {
            const [flipped, setFlipped] = useState(false);
            return (
              <article 
                key={i} 
                className={`sb-flash-card ${card.color} ${flipped ? 'is-flipped' : ''}`}
                onClick={() => setFlipped(!flipped)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                }}
              >
                <div className="sb-flash-inner">
                  <div className="sb-flash-front">
                    <div className="sb-flashAura" />
                    <span>{card.tag}</span>
                    <h4>{card.q}</h4>
                    <div className="sb-flash-hint">Click to reveal answer</div>
                  </div>
                  <div className="sb-flash-back">
                    <p>{card.a}</p>
                    <div className="sb-flash-hint">Click to flip back</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="testimonials" className="sb-section">
        <div className="sb-sectionHead sb-stagger-1">
          <p>Student voices</p>
          <h2>Flashing testimonial cards that feel alive.</h2>
        </div>

        <div className="sb-testimonials sb-stagger-2">
          <article className="sb-testi t1">
            <h3>★★★★★</h3>
            <p>“I got an AI hint instantly and a peer answer within minutes. It actually helped before my exam.”</p>
            <span>Riya · CSE Student</span>
          </article>

          <article className="sb-testi t2">
            <h3>★★★★★</h3>
            <p>“The practice tests feel premium and the leaderboard gives real motivation to contribute.”</p>
            <span>Arjun · MCA Final Year</span>
          </article>

          <article className="sb-testi t3">
            <h3>★★★★★</h3>
            <p>“Mentor booking was smooth, and I could genuinely showcase expertise through reputation.”</p>
            <span>Priya · Mentor</span>
          </article>
        </div>
      </section>

      <section id="blogs" className="sb-section">
        <div className="sb-sectionHead sb-stagger-1">
          <p>From the blog</p>
          <h2>Polished blog cards with hover lift.</h2>
        </div>

        <div className="sb-blogs sb-stagger-2">
          <article className="sb-blog">
            <div className="sb-blogThumb purple">AI</div>
            <div className="sb-blogBody">
              <span>AI Learning</span>
              <h3>How AI-generated MCQs improve revision speed</h3>
            </div>
          </article>

          <article className="sb-blog">
            <div className="sb-blogThumb green">REP</div>
            <div className="sb-blogBody">
              <span>Community</span>
              <h3>Why reputation systems create stronger academic communities</h3>
            </div>
          </article>

          <article className="sb-blog">
            <div className="sb-blogThumb gold">MNT</div>
            <div className="sb-blogBody">
              <span>Mentorship</span>
              <h3>How student mentors can turn knowledge into income</h3>
            </div>
          </article>
        </div>
      </section>

      <section className="sb-section sb-cta sb-stagger-3">
        <div className="sb-sectionHead">
          <h2>Ready to bridge your skill gap?</h2>
          <p style={{ marginTop: '16px', fontSize: '1.2rem', color: 'var(--color-text-muted)', textTransform: 'none', letterSpacing: 'normal' }}>
            Join 4,800+ students already growing on SkillBridge. Free forever for learners.
          </p>
          <div className="sb-actions" style={{ marginTop: '40px' }}>
            <Link href="/auth" className="sb-btnPrimary">Start Learning Free &rarr;</Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
