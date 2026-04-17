'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import './landing.css';
import SkillBridgeIcon from '@/components/ui/SkillBridgeIcon';

// ── CONSTELLATION BACKGROUND IMPORTED GLOBALLY OR VIA COMPONENT ──
import ConstellationBackground from '@/components/ui/ConstellationBackground';
import HeroConstellations from '@/components/ui/HeroConstellations';


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
      {/* ── GLOBAL BACKGROUND ── */}
      <ConstellationBackground opacity={0.5} interactive={false} />

      {/* ── LANDING NAVBAR ── */}
      <nav className="landing-nav">
        <Link href="/" className="landing-nav-logo">
          <SkillBridgeIcon className="landing-nav-logoIcon" />
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
        <HeroConstellations />
        <div className="hero-headline-spotlight" />
        <div className="relative z-10">
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
            <a href="#features" className="btn-ghost" style={{ opacity: 0.8 }}>See how it works ↓</a>
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
      <section className="section reveal" id="features" style={{ textAlign: 'center' }}>
        <div className="section-label">Platform Pillars</div>
        <h2>Everything you need to<br /><em>level up academically</em></h2>
        <p className="sub">Built for students who demand more than passive learning.</p>
        
        <div className="features-grid">
          {[
            { 
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><path d="M12 16V12M12 8H12.01"/></svg>, 
              title: 'AI Doubt Solver', 
              desc: 'Get instant, Gemini-powered hints to unblock your study sessions in seconds.', 
              glow: 'rgba(124,58,237,.15)', border: 'rgba(124,58,237,.5)', shadow: 'rgba(124,58,237,.2)', iconBg: 'rgba(124,58,237,.15)' 
            },
            { 
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 15L8.5 17.5L9.5 13.5L6.5 11L10.5 10.5L12 7L13.5 10.5L17.5 11L14.5 13.5L15.5 17.5L12 15Z"/><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/></svg>, 
              title: 'Reputation Economy', 
              desc: 'Earn points for helping others and unlock exclusive mentor privileges.', 
              glow: 'rgba(6,214,160,.12)', border: 'rgba(6,214,160,.4)', shadow: 'rgba(6,214,160,.15)', iconBg: 'rgba(6,214,160,.12)' 
            },
            { 
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"/><path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"/><path d="M9 12H15M9 16H12"/></svg>, 
              title: 'AI Practice Engine', 
              desc: 'Generate custom MCQ tests on any subject to master concepts through active recall.', 
              glow: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.4)', shadow: 'rgba(245,158,11,.15)', iconBg: 'rgba(245,158,11,.12)' 
            },
            { 
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"/><path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21"/></svg>, 
              title: 'Supabase Realtime', 
              desc: 'Get instant notifications when mentors answer or community doubts are resolved.', 
              glow: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.4)', shadow: 'rgba(239,68,68,.15)', iconBg: 'rgba(239,68,68,.12)' 
            },
            { 
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 10V15M2 10V15M22 10L12 5L2 10L12 15L22 10ZM12 15V20M12 20H8M12 20H16" strokeLinecap="round" strokeLinejoin="round"/></svg>, 
              title: 'Expert Mentors', 
              desc: 'Book verified mentors and graduate from sandbox models to real-world knowledge.', 
              glow: 'rgba(99,102,241,.12)', border: 'rgba(99,102,241,.4)', shadow: 'rgba(99,102,241,.15)', iconBg: 'rgba(99,102,241,.12)' 
            },
            { 
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/></svg>, 
              title: 'Secure by Design', 
              desc: 'Every row is protected by Supabase RLS. Your academic data is private and secure.', 
              glow: 'rgba(236,72,153,.12)', border: 'rgba(236,72,153,.4)', shadow: 'rgba(236,72,153,.15)', iconBg: 'rgba(236,72,153,.12)' 
            },
          ].map((f, i) => (
            <div key={i} className="feat-card" style={{ '--card-glow': f.glow, '--card-border': f.border, '--card-shadow': f.shadow } as React.CSSProperties}>
              <div className="feat-icon" style={{ background: f.iconBg, color: f.border }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DOUBT FEED ── */}
      <section className="section reveal" id="feed" style={{ textAlign: 'center' }}>
        <div className="section-label">Collaborative Learning</div>
        <h2>Resolved Doubts,<br /><em>Growing Reputation</em></h2>
        <p className="sub">Experience a structured community feed designed for rapid resolution and academic trust.</p>
        
        <div className="doubt-feed-grid">
          <div className="df-features">
            {[
              { 
                icon: '✏️', 
                title: 'Rich Composition', 
                desc: 'Post doubts with full rich text support. Include bold emphasis, code blocks, and multiple images to explain your problem.' 
              },
              { 
                icon: '🏷️', 
                title: 'Granular Tagging', 
                desc: 'Categorize your questions by Subject, Branch (CSE, ECE, etc.), and Semester for laser-focused community discovery.' 
              },
              { 
                icon: '⚡', 
                title: 'Community Feedback', 
                desc: 'Upvote high-quality answers and downvote noise. The most helpful solutions naturally bubble to the top.' 
              },
              { 
                icon: '✅', 
                title: 'Resolution Badge', 
                desc: 'Mark one answer as "Accepted" to signal the final solution and help future students find answers faster.' 
              },
              { 
                icon: '📈', 
                title: 'Reputation Awards', 
                desc: 'Earn points for every accepted answer. Build your "Expert Resolver" status and unlock global privileges.' 
              },
            ].map((f, i) => (
              <div key={i} className="df-feature-row">
                <div className="df-icon">{f.icon}</div>
                <div className="df-info">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="df-mockup-wrap">
            <div className="df-mockup-card">
              <div className="df-mockup-filters">
                <div className="df-filter-chip">All</div>
                <div className="df-filter-chip active">Trending</div>
                <div className="df-filter-chip">Unanswered</div>
                <div className="df-filter-chip">My Subject</div>
              </div>
              
              <div className="df-post-card">
                <div className="df-post-user">
                  <div className="df-avatar">AJ</div>
                  <div style={{fontSize: '0.85rem', fontWeight: 600}}>Alex Johnson <span style={{opacity: 0.5, fontWeight: 400}}>· 2h ago</span></div>
                </div>
                <div className="df-post-title">How does the worst-case complexity of QuickSort change with random pivot selection?</div>
                <div className="df-tags">
                  <span className="df-tag">Algorithms</span>
                  <span className="df-tag">CSE</span>
                  <span className="df-tag">Mid-sem</span>
                </div>
                <div style={{fontSize: '0.85rem', opacity: 0.8, background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem'}}>
                   "Randomizing the pivot reduces the probability of O(n²) worst case to nearly zero..."
                </div>
                <div className="df-post-footer">
                  <div className="df-votes">
                    <div className="df-vote-btn">▲</div>
                    <span>42</span>
                    <div className="df-vote-btn">▼</div>
                  </div>
                  <div className="df-actions">
                    <div className="df-accepted">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      Accepted
                    </div>
                    <div className="df-rep">+20 Pts</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.7rem', opacity: 0.4, letterSpacing: '0.05em' }}>
                SCROLL FOR MORE DOUBTS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REPUTATION & GAMIFICATION ── */}
      <section className="section reveal" id="reputation" style={{ textAlign: 'center' }}>
        <div className="section-label">The Contribution Loop</div>
        <h2>Proof of Knowledge,<br /><em>Built through Consistency</em></h2>
        <p className="sub">Earn reputation by solving community doubts. Your profile reflects your actual expertise and helpfulness.</p>
        
        <div className="reputation-grid">
          <div className="rep-content">
            <div className="reward-list">
              {[
                { label: 'Accepted Answer', pts: '+25', desc: 'The highest honor. Finalize a doubt and unblock the community.', highlight: true },
                { label: 'Solving a Doubt', pts: '+10', desc: 'Provide helpful context to a pending question.' },
                { label: 'Knowledge Streak', pts: '+2', desc: 'Daily commitment to the SkillBridge ecosystem.' },
                { label: 'Mock Mastery', pts: '+5', desc: 'Successfully completing practice test rounds.' },
              ].map((r, i) => (
                <div key={i} className="reward-item">
                  <div className="reward-label">
                    <div style={{width: '24px', textAlign: 'center'}}>{i === 0 ? '🏆' : i === 1 ? '💡' : i === 2 ? '🔥' : '📝'}</div>
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                      <span style={{color: 'white', fontWeight: 600, fontSize: '0.95rem'}}>{r.label}</span>
                      <span style={{fontSize: '0.8rem', fontWeight: 400}}>{r.desc}</span>
                    </div>
                  </div>
                  <div className={`reward-pts ${r.highlight ? 'highlight' : ''}`}>{r.pts}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-mockup-wrap">
            <div className="profile-mockup">
              <div className="pm-header">
                <div className="pm-avatar">MK</div>
                <div className="pm-rep-ring">
                  <div className="pm-rep-val">1,240</div>
                  <div className="pm-rep-label">REPUTATION</div>
                </div>
              </div>

              <div className="pm-stats">
                <div className="pm-stat-box">
                  <div className="pm-stat-val">156</div>
                  <div className="pm-stat-label">Doubts Solved</div>
                </div>
                <div className="pm-stat-box">
                  <div className="pm-stat-val">92%</div>
                  <div className="pm-stat-label">Accuracy</div>
                </div>
              </div>

              <div className="pm-badges">
                <div className="pm-badges-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  Milestone Badges
                </div>
                <div className="badge-grid">
                  {[
                    { icon: '🥉', name: 'First Answer' },
                    { icon: '🥈', name: 'Helpful Mentor' },
                    { icon: '🔥', name: 'Streak Master' },
                    { icon: '📜', name: 'Subject Expert' },
                  ].map((b, i) => (
                    <div key={i} className="badge-item">
                      {b.icon}
                      <div className="badge-tooltip">{b.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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

      {/* ── MENTOR SYSTEM ── */}
      <section className="section reveal" id="mentorship" style={{ textAlign: 'center' }}>
        <div className="section-label">Mentorship Ecosystem</div>
        <h2>Expert Guidance,<br /><em>Built on Trust</em></h2>
        <p className="sub">From verified applications to seamless live sessions, bridge the knowledge gap with ease.</p>
        
        <div className="mentor-grid">
          <div className="mentor-steps">
            {[
              { 
                icon: '📝', 
                title: 'Step 1: Apply', 
                desc: 'Scholars with proven expertise apply to share their knowledge and earn by mentoring.' 
              },
              { 
                icon: '🛡️', 
                title: 'Step 2: Approve', 
                desc: 'Admin verification ensures only top-tier content and verified credentials join the fleet.' 
              },
              { 
                icon: '📅', 
                title: 'Step 3: Schedule', 
                desc: 'Mentors open 30-min slots and link their preferred platforms (Google Meet / Jitsi).' 
              },
              { 
                icon: '💳', 
                title: 'Step 4: Book & Pay', 
                desc: 'Students select availability and complete a sandbox payment to secure the session.' 
              },
            ].map((step, i) => (
              <div key={i} className="mentor-step">
                <div className="step-icon" style={{ background: i === 0 ? 'rgba(6,214,160,0.1)' : i === 1 ? 'rgba(124,58,237,0.1)' : i === 2 ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)', color: i === 0 ? '#06d6a0' : i === 1 ? '#7c3aed' : i === 2 ? '#f59e0b' : '#6366f1' }}>
                  {step.icon}
                </div>
                <div className="step-info">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mentor-preview">
            <div className="mentor-mockup-card">
              <div className="mockup-header">
                <div className="mockup-avatar">SC</div>
                <div className="mockup-name-row">
                  <div className="mockup-name">Dr. Sarah Chen <span style={{fontSize: '0.8rem', opacity: 0.6, fontWeight: 400}}>AI Expert</span></div>
                  <div className="mockup-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    Approved Mentor
                  </div>
                </div>
              </div>
              <div className="mockup-content">
                <div className="mockup-label">Select Availability (30 Min)</div>
                <div className="slot-grid">
                  <button className="slot-btn">10:30 AM</button>
                  <button className="slot-btn active">11:00 AM</button>
                  <button className="slot-btn">02:30 PM</button>
                  <button className="slot-btn">04:00 PM</button>
                  <button className="slot-btn">05:30 PM</button>
                  <div className="slot-meet-cue">🔗 Link available via Google Meet</div>
                </div>
              </div>
              <div className="mockup-footer">
                <div className="fee-pill">Fee: <span>₹250</span></div>
                <button className="mockup-cta">Secure Booking</button>
              </div>
              <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Sandbox Payment Enabled
              </div>
            </div>
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
        <div className="footer-copy">© 2026 SkillBridge · Built at SkillBridge Hackathon 🚀</div>
        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="https://github.com/ayushjhaa1187-spec/SkillBridge" target="_blank" rel="noopener">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
