'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './page.module.css';

// Animated Logo SVG Component
const Logo = () => (
  <svg viewBox="0 0 180 60" className={styles.logo} aria-label="SkillBridge Logo">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#14B8A6" />
      </linearGradient>
      <filter id="logoGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#logoGlow)">
      <path d="M15 35 Q 55 5 95 35 Q 135 5 175 35" stroke="url(#logoGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="55" cy="35" r="8" fill="#8B5CF6" className={styles.logoDot} />
      <circle cx="135" cy="35" r="8" fill="#14B8A6" className={styles.logoDot} />
      <circle cx="95" cy="35" r="6" fill="#3B82F6" />
    </g>
    <text x="110" y="45" className={styles.logoText} fill="white" fontWeight="700" fontSize="20">SKILLBRIDGE</text>
  </svg>
);

// Tagline with animated gradient text
const Tagline = () => (
  <div className={styles.taglineWrapper}>
    <span className={styles.tagline}>Bridge the Gap.</span>
    <span className={styles.tagline}>Learn.</span>
    <span className={styles.tagline}>Earn.</span>
    <span className={styles.tagline}>Grow.</span>
  </div>
);

// Particle Canvas Background
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string }[] = [];
    const colors = ['#8B5CF6', '#3B82F6', '#14B8A6', '#F472B6', '#F59E0B'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 - dist / 800})`;
            ctx.stroke();
          }
        });
      });
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className={styles.particleCanvas} />;
};

// Glowing Flashcard Component
const Flashcard = ({ title, desc, icon, color }: { title: string; desc: string; icon: string; color: string }) => (
  <div className={`${styles.flashcard} ${styles[`flashcard${color}`]}`}>
    <div className={styles.flashcardInner}>
      <div className={styles.flashcardIcon}>{icon}</div>
      <h3 className={styles.flashcardTitle}>{title}</h3>
      <p className={styles.flashcardDesc}>{desc}</p>
      <div className={styles.flashcardGlow}></div>
    </div>
  </div>
);

// Testimonial Card with animated border
const Testimonial = ({ quote, author, role, color }: { quote: string; author: string; role: string; color: string }) => (
  <div className={`${styles.testimonialCard} ${styles[`testimonial${color}`]}`}>
    <p className={styles.testimonialQuote}>{quote}</p>
    <div className={styles.testimonialAuthor}>
      <div className={styles.authorAvatar}></div>
      <div>
        <strong>{author}</strong>
        <span>{role}</span>
      </div>
    </div>
  </div>
);

// Blog Card
const BlogCard = ({ title, excerpt, image, date }: { title: string; excerpt: string; image: string; date: string }) => (
  <article className={styles.blogCard}>
    <div className={styles.blogImage} style={{ backgroundImage: `linear-gradient(135deg, ${image})` }}></div>
    <div className={styles.blogContent}>
      <span className={styles.blogDate}>{date}</span>
      <h4 className={styles.blogTitle}>{title}</h4>
      <p className={styles.blogExcerpt}>{excerpt}</p>
      <Link href="/blog" className={styles.blogLink}>Read More →</Link>
    </div>
  </article>
);

export default function Home() {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) setVisibleSections((prev) => ({ ...prev, [id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '-50px' }
    );

    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setSectionRef = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  const isVisible = (id: string) => visibleSections[id];

  return (
    <div className={styles.page}>
      <ParticleCanvas />

      {/* Hero Section */}
      <section ref={setSectionRef('hero')} data-section="hero" className={`${styles.heroSection} ${isVisible('hero') ? styles.visible : ''}`}>
        <div className={styles.heroContent}>
          <Logo />
          <Tagline />
          <h1 className={styles.heroTitle}>
            The Peer Learning &
            <span className={styles.heroAccent}>Doubt Resolution Platform</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Solve complex doubts with AI-first assistance powered by Google Gemini, connect with verified student mentors,
            attend live doubt sessions, and test your knowledge with personalized quizzes. Built for college students, by college students.
          </p>
          <div className={styles.heroCta}>
            <Link href="/auth" className={styles.ctaPrimary}>Get Started Free</Link>
            <Link href="/mentors" className={styles.ctaSecondary}>Find a Mentor</Link>
          </div>
          <div className={styles.socialProof}>
            <div className={styles.avatars}>
              {[1, 2, 3, 4].map((i) => (
                <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} alt="student" className={styles.avatar} />
              ))}
            </div>
            <span>Joined by <strong>2,000+</strong> students this semester</span>
          </div>
        </div>
      </section>

      {/* Running Ticker */}
      <div className={styles.tickerContainer}>
        <div className={styles.ticker}>
          {['NEW DOUT RESOLVED', 'MENTOR SESSION BOOKED', 'TEST COMPLETED', 'BADGE EARNED', 'NEW DOUT RESOLVED', 'MENTOR SESSION BOOKED', 'TEST COMPLETED', 'BADGE EARNED'].map((item, i) => (
            <span key={i} className={styles.tickerItem}>{item}</span>
          ))}
        </div>
      </div>

      {/* Flashcards Section */}
      <section ref={setSectionRef('flashcards')} data-section="flashcards" className={`${styles.section} ${styles.flashcardsSection} ${isVisible('flashcards') ? styles.visible : ''}`}>
        <h2 className={styles.sectionTitle}>Why SkillBridge?</h2>
        <div className={styles.flashcardGrid}>
          <Flashcard title="AI Doubt Hub" desc="Instant Google Gemini explanations for your toughest questions, 24/7." icon="🦉" color="Violet" />
          <Flashcard title="Reputation System" desc="Earn points for helping others and build your academic credibility." icon="💎" color="Blue" />
          <Flashcard title="Expert Mentors" desc="Book 1:1 sessions with verified students who have mastered the coursework." icon="📅" color="Teal" />
        </div>
      </section>

      {/* Stats Section */}
      <section ref={setSectionRef('stats')} data-section="stats" className={`${styles.section} ${styles.statsSection} ${isVisible('stats') ? styles.visible : ''}`}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>5K+</span>
            <span className={styles.statLabel}>Doubts Resolved</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>500+</span>
            <span className={styles.statLabel}>Active Mentors</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>10K+</span>
            <span className={styles.statLabel}>Practice Tests Taken</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>95%</span>
            <span className={styles.statLabel}>Satisfaction Rate</span>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={setSectionRef('testimonials')} data-section="testimonials" className={`${styles.section} ${styles.testimonialsSection} ${isVisible('testimonials') ? styles.visible : ''}`}>
        <h2 className={styles.sectionTitle}>What Students Say</h2>
        <div className={styles.testimonialGrid}>
          <Testimonial quote="SkillBridge helped me clear my OS doubts in minutes. The AI hints are incredible!" author="Priya Sharma" role="CS Student, IIT Delhi" color="Purple" />
          <Testimonial quote="I earned my first 1000 points as a mentor. The platform is gamified perfectly." author="Rahul Verma" role="Mentor, DTU" color="Gold" />
          <Testimonial quote="The live doubt sessions with mentors changed my entire approach to studying." author="Ananya Gupta" role="Data Science Student" color="Teal" />
          <Testimonial quote="Finally, a platform that feels like Stack Overflow but for college students." author="Aditya Singh" role="Engineering Student" color="Pink" />
        </div>
      </section>

      {/* Blog Section */}
      <section ref={setSectionRef('blog')} data-section="blog" className={`${styles.section} ${styles.blogSection} ${isVisible('blog') ? styles.visible : ''}`}>
        <h2 className={styles.sectionTitle}>Latest from the Blog</h2>
        <div className={styles.blogGrid}>
          <BlogCard title="How to Ace Your Data Structures Exams" excerpt="Top strategies from our top 100 mentors on mastering DS&A." image="#8B5CF6, #3B82F6" date="Apr 5, 2026" />
          <BlogCard title="The Art of Peer Learning" excerpt="Why collaborative learning beats solo study every time." image="#14B8A6, #8B5CF6" date="Apr 3, 2026" />
          <BlogCard title="Building Your Academic Reputation" excerpt="A guide to earning badges and growing your SkillBridge profile." image="#F472B6, #8B5CF6" date="Apr 1, 2026" />
        </div>
      </section>

      {/* CTA Section */}
      <section ref={setSectionRef('cta')} data-section="cta" className={`${styles.section} ${styles.ctaSection} ${isVisible('cta') ? styles.visible : ''}`}>
        <div className={styles.ctaContent}>
          <h2>Ready to Transform Your Learning?</h2>
          <p>Join thousands of students who are already learning smarter with SkillBridge.</p>
          <Link href="/auth" className={styles.ctaPrimary}>Start Learning Today</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <Logo />
          <p className={styles.footerTagline}>Bridge the Gap. Learn. Earn. Grow.</p>
          <div className={styles.footerLinks}>
            <Link href="/about">About</Link>
            <Link href="/mentors">Mentors</Link>
            <Link href="/tests">Practice Tests</Link>
            <Link href="/blog">Blog</Link>
          </div>
          <span className={styles.footerCopy}>© 2026 SkillBridge. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
