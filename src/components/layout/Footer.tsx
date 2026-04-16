'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Linkedin, Instagram, Youtube, Facebook, ArrowRight } from 'lucide-react';
import './footer.css';

export default function Footer() {
  return (
    <footer className="sb-premium-footer">
      {/* 1. Newsletter Section (Stay Updated) */}
      <div className="sb-newsletter-container">
        <div className="sb-newsletter-wrapper">
          <div className="sb-newsletter-text">
            <h3>Stay Updated</h3>
            <p>Subscribe to our newsletter for the latest updates, resources, and special offers.</p>
          </div>
          <div className="sb-newsletter-form">
            <input type="email" placeholder="Enter your email" className="sb-newsletter-input" />
            <button className="sb-newsletter-submit">
              Subscribe <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Content */}
      <div className="sb-footer-main">
        <div className="sb-footer-grid">
          {/* Column 1: Brand & Contact */}
          <div className="sb-footer-col brand-col">
            <Link href="/" className="sb-footer-logo">
              <svg className="sb-logo-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="footerG" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06d6a0" />
                  </linearGradient>
                </defs>
                <path d="M4 28 Q20 8 36 28" stroke="url(#footerG)" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
              <span className="sb-logo-text">Skill<span>Bridge</span></span>
            </Link>
            <p className="sb-brand-desc">
              Comprehensive learning resources for engineering students and learners of Computer Science/IT-related subjects.
            </p>
            <div className="sb-contact-info">
              <div className="sb-contact-item">
                <MapPin size={18} />
                <span>Noida, Uttar Pradesh 201301</span>
              </div>
              <div className="sb-contact-item">
                <Phone size={18} />
                <span>+91 89350 69570</span>
              </div>
              <div className="sb-contact-item">
                <Mail size={18} />
                <span>contact@skillbridge.edu.in</span>
              </div>
            </div>
            <div className="sb-social-links">
              <Link href="#"><Linkedin size={20} /></Link>
              <Link href="#"><Instagram size={20} /></Link>
              <Link href="#"><Youtube size={20} /></Link>
              <Link href="#"><Facebook size={20} /></Link>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="sb-footer-col links-col">
            <h4 className="sb-col-title quick-links">Quick Links</h4>
            <ul className="sb-footer-list">
              <li><Link href="/courses"><ArrowRight size={14} /> Courses</Link></li>
              <li><Link href="/learn"><ArrowRight size={14} /> Learn</Link></li>
              <li><Link href="/blog"><ArrowRight size={14} /> Blog</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="sb-footer-col links-col">
            <h4 className="sb-col-title company">Company</h4>
            <ul className="sb-footer-list">
              <li><Link href="/about"><ArrowRight size={14} /> About Us</Link></li>
              <li><Link href="/contact"><ArrowRight size={14} /> Contact</Link></li>
              <li><Link href="/careers"><ArrowRight size={14} /> Careers</Link></li>
              <li><Link href="/training"><ArrowRight size={14} /> Training</Link></li>
              <li><Link href="/blog"><ArrowRight size={14} /> Blog</Link></li>
              <li><Link href="/courses"><ArrowRight size={14} /> Courses</Link></li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div className="sb-footer-col resources-col">
            <h4 className="sb-col-title resources">Resources</h4>
            <div className="sb-resource-grid">
              <Link href="/resources/dsa" className="sb-resource-card">
                <h5>DSA Cheat Sheet</h5>
                <p>Algorithms and data structures reference</p>
              </Link>
              <Link href="/resources/os" className="sb-resource-card">
                <h5>OS Notes</h5>
                <p>Operating systems concepts explained</p>
              </Link>
              <Link href="/resources/dbms" className="sb-resource-card">
                <h5>DBMS Tutorial</h5>
                <p>Database management fundamentals</p>
              </Link>
              <Link href="/resources/practice" className="sb-resource-card">
                <h5>Coding Practice</h5>
                <p>Programming exercises and solutions</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="sb-footer-bottom">
        <div className="sb-bottom-wrapper">
          <p className="sb-copyright">© 2026 SkillBridge. All rights reserved.</p>
          <div className="sb-legal-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/cookies">Cookie Policy</Link>
            <Link href="/pricing-policy">Pricing Policy</Link>
            <Link href="/refund-policy">Refund Policy</Link>
            <Link href="/shipping-policy">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
