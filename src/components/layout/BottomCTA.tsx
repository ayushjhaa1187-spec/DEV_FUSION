'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import './bottom-cta.css';

export default function BottomCTA() {
  return (
    <section className="sb-bottom-cta">
      <div className="sb-cta-container">
        <div className="sb-cta-content">
          <div className="sb-cta-badge">
            <Sparkles size={16} />
            <span>Join Our Community</span>
          </div>
          
          <h2 className="sb-cta-title">
            Ready to Simplify Your Learning?
          </h2>
          
          <p className="sb-cta-description">
            Join thousands of students who are already benefiting from our courses and resources. 
            Free forever for learners.
          </p>

          <div className="sb-cta-actions">
            <Link href="/courses" className="sb-cta-btn primary">
              Explore Courses <ArrowRight size={18} />
            </Link>
            <Link href="/contact" className="sb-cta-btn secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
