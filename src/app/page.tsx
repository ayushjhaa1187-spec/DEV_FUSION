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
      <path d="M15 35 Q 55 5 95 35 T 165 35" stroke="url(#logoGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="15" cy="35" r="8" fill="#8B5CF6" className={styles.logoDot} />
      <circle cx="55" cy="35" r="8" fill="#3B82F6" className={styles.logoDot} />
      <circle cx="95" cy="35" r="6" fill="#14B8A6" />
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
  }, []);;

// Navbar Component
const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <Logo />
      <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
        <a href="#hero" className={styles.navLink}>Home</a>
        <a href="#features" className={styles.navLink}>Features</a>
        <a href="#testimonials" className={styles.navLink}>Testimonials</a>
        <a href="#blog" className={styles.navLink}>Blog</a>
        <a href="/privacy" className={styles.navLink}>Legal</a>
      </div>
      <button className={styles.navCta}>Get Started</button>
      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
};

// Hero Section
const Hero = () => (
  <section id="hero" className={styles.hero}>
    <div className={styles.heroBg}>
      <div className={styles.heroGlow}></div>
    </div>
    <div className={styles.heroContent}>
      <h1 className={styles.heroTitle}>
        Welcome to <span className={styles.gradientText}>SkillBridge</span>
      </h1>
      <p className={styles.heroSubtitle}>
        Your all-in-one platform to bridge the gap between learning and earning.
        Discover courses, earn rewards, and grow your skills.
      </p>
      <div className={styles.heroActions}>
        <button className={styles.primaryBtn}>Start Learning</button>
        <button className={styles.secondaryBtn}>Explore Courses</button>
      </div>
    </div>
  </section>
);

// Tech Ticker Section
const TechTicker = () => {
  const techs = ['JavaScript', 'Python', 'React', 'Node.js', 'AI/ML', 'Cloud', 'DevOps', 'Next.js'];

  return (
    <section className={styles.ticker}>
      <div className={styles.tickerTrack}>
        {[...techs, ...techs, ...techs, ...techs].map((tech, i) => (
          <span key={i} className={styles.tickerItem}>{tech}</span>
        ))}
      </div>
    </section>
  );
};

// Features Section
const Features = () => {
  const features = [
    { title: 'Interactive Learning', desc: 'Hands-on courses with real projects', icon: '📚' },
    { title: 'Earn While Learning', desc: 'Get rewarded for completing modules', icon: '💰' },
    { title: 'AI-Powered Paths', desc: 'Personalized learning recommendations', icon: '🤖' },
    { title: 'Community Support', desc: 'Learn together with peers', icon: '👥' },
    { title: 'Industry Certifications', desc: 'Verified credentials for your resume', icon: '🏆' },
    { title: 'Career Guidance', desc: 'Expert mentorship and job prep', icon: '🎯' },
  ];

  return (
    <section id="features" className={styles.features}>
      <h2 className={styles.sectionTitle}>Why Choose SkillBridge?</h2>
      <p className={styles.sectionDesc}>Everything you need to succeed in your tech journey</p>
      <div className={styles.featuresGrid}>
        {features.map((f, i) => (
          <div key={i} className={styles.featureCard}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// Flashcards Section
const Flashcards = () => {
  const [active, setActive] = useState(0);
  const cards = [
    { q: 'What is React?', a: 'A JavaScript library for building user interfaces' },
    { q: 'What is Node.js?', a: 'A runtime environment for JavaScript on the server' },
    { q: 'What is AI/ML?', a: 'Artificial Intelligence and Machine Learning technologies' },
  ];

  return (
    <section className={styles.flashcards}>
      <h2 className={styles.sectionTitle}>Quick Knowledge Checks</h2>
      <p className={styles.sectionDesc}>Test your understanding with interactive flashcards</p>
      <div className={styles.flashcardsGrid}>
        {cards.map((card, i) => (
          <div
            key={i}
            className={`${styles.flashcard} ${active === i ? styles.flashcardActive : ''}`}
            onClick={() => setActive(i)}
          >
            <div className={styles.flashcardInner}>
              <div className={styles.flashcardFront}>
                <span className={styles.flashcardQ}>{card.q}</span>
                <span className={styles.flashcardHint}>Click to reveal</span>
              </div>
              <div className={styles.flashcardBack}>
                <span className={styles.flashcardA}>{card.a}</span>
                <span className={styles.flashcardHint}>Click to flip back</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Testimonials Section
const Testimonials = () => {
  const testimonials = [
    { name: 'Priya Sharma', role: 'Full-Stack Developer', text: 'SkillBridge helped me transition from a beginner to a job-ready developer in just 6 months. The hands-on projects were game-changers!' },
    { name: 'Rahul Verma', role: 'Data Scientist', text: 'The AI-powered learning paths saved me so much time. I found exactly what I needed to upskill for my dream role.' },
    { name: 'Ananya Das', role: 'Product Manager', text: 'I love how SkillBridge bridges the gap between theory and practice. The earning rewards kept me motivated throughout.' },
  ];

  const [current, setCurrent] = useState(0);

  return (
    <section id="testimonials" className={styles.testimonials}>
      <h2 className={styles.sectionTitle}>What Our Learners Say</h2>
      <p className={styles.sectionDesc}>Join thousands of successful SkillBridge graduates</p>
      <div className={styles.testimonialCards}>
        {testimonials.map((t, i) => (
          <div
            key={i}
            className={`${styles.testimonialCard} ${i === current ? styles.testimonialActive : ''}`}
          >
            <p className={styles.testimonialText}>"{t.text}"</p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar}>{t.name[0]}</div>
              <div>
                <h4 className={styles.testimonialName}>{t.name}</h4>
                <span className={styles.testimonialRole}>{t.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.testimonialDots}>
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

// Blog Section
const Blog = () => {
  const posts = [
    { title: 'Getting Started with React in 2025', date: 'Dec 15, 2024', category: 'Tutorial' },
    { title: 'Top 10 AI Tools Every Developer Should Know', date: 'Dec 10, 2024', category: 'AI/ML' },
    { title: 'How to Build a Portfolio That Gets You Hired', date: 'Dec 5, 2024', category: 'Career' },
  ];

  return (
    <section id="blog" className={styles.blog}>
      <h2 className={styles.sectionTitle}>Latest from the Blog</h2>
      <p className={styles.sectionDesc}>Stay updated with the latest in tech and learning</p>
      <div className={styles.blogGrid}>
        {posts.map((post, i) => (
          <article key={i} className={styles.blogCard}>
            <span className={styles.blogCategory}>{post.category}</span>
            <h3 className={styles.blogTitle}>{post.title}</h3>
            <span className={styles.blogDate}>{post.date}</span>
          </article>
        ))}
      </div>
    </section>
  );
};

// CTA Section
const CTA = () => (
  <section className={styles.cta}>
    <div className={styles.ctaContent}>
      <h2 className={styles.ctaTitle}>Ready to Transform Your Career?</h2>
      <p className={styles.ctaDesc}>Join SkillBridge today and start your journey to success.</p>
      <button className={styles.ctaBtn}>Get Started for Free</button>
    </div>
    <div className={styles.ctaBg}>
      <div className={styles.ctaGlow}></div>
    </div>
  </section>
);

// Footer Component
const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.footerTop}>
      <div className={styles.footerCol}>
        <Logo />
        <p className={styles.footerDesc}>
          Bridge the gap between learning and earning with SkillBridge.
        </p>
      </div>
      <div className={styles.footerCol}>
        <h4>Product</h4>
        <a href="#features">Features</a>
        <a href="#blog">Blog</a>
        <a href="/pricing">Pricing</a>
        <a href="/courses">Courses</a>
      </div>
      <div className={styles.footerCol}>
        <h4>Resources</h4>
        <a href="/docs">Documentation</a>
        <a href="/help">Help Center</a>
        <a href="/community">Community</a>
        <a href="/tutorials">Tutorials</a>
      </div>
      <div className={styles.footerCol}>
        <h4>Legal</h4>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/cookies">Cookie Policy</a>
        <a href="/disclaimer">Disclaimer</a>
      </div>
      <div className={styles.footerCol}>
        <h4>Company</h4>
        <a href="/about">About Us</a>
        <a href="/contact">Contact</a>
        <a href="/careers">Careers</a>
        <a href="/press">Press Kit</a>
      </div>
    </div>
    <div className={styles.footerBottom}>
      <span className={styles.copyright}>
        &copy; 2025 SkillBridge. All rights reserved.
      </span>
      <div className={styles.socialLinks}>
        <a href="#" aria-label="Twitter">𝕏</a>
        <a href="#" aria-label="LinkedIn">in</a>
        <a href="#" aria-label="GitHub">GH</a>
        <a href="#" aria-label="YouTube">YT</a>
      </div>
    </div>
  </footer>
);

// Scroll Reveal Hook
const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
};

// Main Page Component
export default function Page() {
  const { ref: heroRef, isVisible: heroVisible } = useScrollReveal();
  const { ref: featuresRef, isVisible: featuresVisible } = useScrollReveal();
  const { ref: testimonialsRef, isVisible: testimonialsVisible } = useScrollReveal();
  const { ref: blogRef, isVisible: blogVisible } = useScrollReveal();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal();

  return (
    <main className={styles.main}>
      <ParticleCanvas />
      <Navbar />
      <Tagline />
      <div ref={heroRef} className={heroVisible ? styles.reveal : styles.hidden}>
        <Hero />
      </div>
      <TechTicker />
      <div ref={featuresRef} className={featuresVisible ? styles.reveal : styles.hidden}>
        <Features />
      </div>
      <Flashcards />
      <div ref={testimonialsRef} className={testimonialsVisible ? styles.reveal : styles.hidden}>
        <Testimonials />
      </div>
      <div ref={blogRef} className={blogVisible ? styles.reveal : styles.hidden}>
        <Blog />
      </div>
      <div ref={ctaRef} className={ctaVisible ? styles.reveal : styles.hidden}>
        <CTA />
      </div>
      <Footer />
    </main>
  );
}

  return <canvas ref={canvasRef} className={styles.particleCanvas} />;
};
