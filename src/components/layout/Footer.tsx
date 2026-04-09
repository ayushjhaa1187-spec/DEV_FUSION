import Link from 'next/link';
import './footer.css';

export default function Footer() {
  return (
    <footer className="sb-footer">
      <div className="sb-footerContent">
        <div className="sb-footerBrand">
          <Link href="/" className="sb-logo">
            <svg className="sb-logoIcon" viewBox="0 0 40 40" fill="none">
              <defs>
                <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="40" y2="40">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#06d6a0" />
                </linearGradient>
              </defs>
              <path d="M4 28 Q20 8 36 28" stroke="url(#footerLogoGrad)" strokeWidth="3" fill="none" />
              <line x1="4" y1="28" x2="36" y2="28" stroke="url(#footerLogoGrad)" strokeWidth="2.5" />
            </svg>
            <span className="sb-logoText">Skill<span>Bridge</span></span>
          </Link>
          <p className="sb-footerDesc">
            The premium peer-learning ecosystem for college students. Build reputation, 
            solve doubts, and connect with mentors.
          </p>
        </div>

        <div className="sb-footerLinks">
          <div className="sb-linkGroup">
            <h4>Platform</h4>
            <Link href="/doubts">Doubts</Link>
            <Link href="/mentors">Mentors</Link>
            <Link href="/tests">Practice</Link>
          </div>
          <div className="sb-linkGroup">
            <h4>Community</h4>
            <Link href="/about">Our Vision</Link>
            <Link href="/blog">Success Stories</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>
          <div className="sb-linkGroup">
            <h4>Legal</h4>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </div>
      
      <div className="sb-footerBottom">
        <p>© {new Date().getFullYear()} SkillBridge. Built for students, by students.</p>
        <div className="sb-socials">
          <a href="#">X</a>
          <a href="#">LinkedIn</a>
          <a href="#">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
