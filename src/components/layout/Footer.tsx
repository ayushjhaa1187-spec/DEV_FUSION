'use client';

import Link from 'next/link';
import { 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Send, 
  Mail, 
  MapPin, 
  ChevronRight,
  ShieldCheck,
  Zap,
  BookOpen,
  HelpCircle,
  FileText,
  Target,
  Users
} from 'lucide-react';
import './footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="sb-premium-footer">
      {/* 1. Newsletter Strip - Inspired by Screenshot 3 */}
      <div className="sb-newsletter-container">
        <div className="sb-newsletter-wrapper">
          <div className="sb-newsletter-text">
            <h3>Stay Updated</h3>
            <p>Subscribe to our newsletter and never miss an update on new courses and resources.</p>
          </div>
          <form className="sb-newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="sb-newsletter-input" 
              required
            />
            <button type="submit" className="sb-newsletter-submit">
              Subscribe <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* 2. Main Footer - Inspired by Screenshot 2 */}
      <div className="sb-footer-main">
        <div className="sb-footer-grid">
          
          {/* Brand Column */}
          <div className="sb-brand-col">
            <Link href="/" className="sb-footer-logo">
              <div className="sb-logo-icon">
                <Zap fill="#7c3aed" color="#7c3aed" />
              </div>
              <span className="sb-logo-text">Skill<span>Bridge</span></span>
            </Link>
            <p className="sb-brand-desc">
              SkillBridge is bridging the gap between knowledge and mastery through peer-to-peer learning and AI assistance. Join the next generation of learners.
            </p>
            <div className="sb-contact-info">
              <div className="sb-contact-item">
                <Mail size={16} />
                <span>support@skillbridge.academy</span>
              </div>
              <div className="sb-contact-item">
                <MapPin size={16} />
                <span>Global Learning Hub, Tech City</span>
              </div>
            </div>
            <div className="sb-social-links">
              <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
              <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
              <a href="#" aria-label="YouTube"><Youtube size={20} /></a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="sb-links-col">
            <h4 className="sb-col-title quick-links">Quick Links</h4>
            <ul className="sb-footer-list">
              <li><Link href="/">Home <ChevronRight size={14} /></Link></li>
              <li><Link href="/courses">Courses <ChevronRight size={14} /></Link></li>
              <li><Link href="/mentors">Find Mentors <ChevronRight size={14} /></Link></li>
              <li><Link href="/blog">Our Blog <ChevronRight size={14} /></Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="sb-links-col">
            <h4 className="sb-col-title company">Company</h4>
            <ul className="sb-footer-list">
              <li><Link href="/about">About Us <ChevronRight size={14} /></Link></li>
              <li><Link href="/careers">Careers <ChevronRight size={14} /></Link></li>
              <li><Link href="/training">Corporate Training <ChevronRight size={14} /></Link></li>
              <li><Link href="/contact">Contact Support <ChevronRight size={14} /></Link></li>
            </ul>
          </div>

          {/* Resources Mini-Grid - Inspired by Resources card design in Screenshot 2 */}
          <div className="sb-resources-col">
            <h4 className="sb-col-title resources">Resources</h4>
            <div className="sb-resource-grid">
              <Link href="/resources/dsa" className="sb-resource-card">
                <div className="sb-res-icon dsa"><Target size={16} /></div>
                <div>
                  <h5>DSA Roadmap</h5>
                  <p>Prep Guide</p>
                </div>
              </Link>
              <Link href="/resources/os" className="sb-resource-card">
                <div className="sb-res-icon os"><BookOpen size={16} /></div>
                <div>
                  <h5>OS Concepts</h5>
                  <p>Core Knowledge</p>
                </div>
              </Link>
              <Link href="/resources/dbms" className="sb-resource-card">
                <div className="sb-res-icon dbms"><ShieldCheck size={16} /></div>
                <div>
                  <h5>DBMS Guide</h5>
                  <p>SQL & NoSQL</p>
                </div>
              </Link>
              <Link href="/resources/practice" className="sb-resource-card">
                <div className="sb-res-icon practice"><Users size={16} /></div>
                <div>
                  <h5>Practice Hub</h5>
                  <p>Peer Challenges</p>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Bottom Bar - Inspired by Screenshot 1 */}
      <div className="sb-footer-bottom">
        <div className="sb-bottom-wrapper">
          <p className="sb-copyright">
            © {currentYear} SkillBridge Academy. All rights reserved. Built for future innovators.
          </p>
          <div className="sb-legal-links">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/refund-policy">Refund Policy</Link>
            <Link href="/shipping-policy">Shipping Policy</Link>
            <Link href="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
