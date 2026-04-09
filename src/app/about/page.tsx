import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import '../landing.css';

export default function AboutPage() {
  return (
    <main className="sb-page">
      <Navbar />
      
      <section className="sb-hero" style={{ paddingTop: '160px' }}>
        <div className="sb-heroBadge">
          <span className="sb-badgeDot" />
          Our Vision & Mission
        </div>

        <h1 className="sb-title">
          Bridging the gap between 
          <br />
          <span>Knowledge and Mastery.</span>
        </h1>

        <p className="sb-subtitle" style={{ maxWidth: '800px', margin: '0 auto' }}>
          SkillBridge was born from a simple observation: students learn best from other students. 
          We're building the world's most intuitive peer-to-peer academic ecosystem.
        </p>
      </section>

      <section className="sb-section">
        <div className="sb-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <article className="sb-card purple">
            <div className="sb-cardGlow" />
            <h3>Peer Empowerment</h3>
            <p>We believe every student has something to teach. Our reputation system ensures that your contributions are recognized.</p>
          </article>

          <article className="sb-card green">
            <div className="sb-cardGlow" />
            <h3>AI-Assisted Growth</h3>
            <p>Our AI doesn't just give answers—it provides conceptual clarity, helping you bridge the gap in your understanding.</p>
          </article>

          <article className="sb-card gold">
            <div className="sb-cardGlow" />
            <h3>Mentor Connections</h3>
            <p>Access expert guidance from senior students and professionals who have navigated the same path you're on.</p>
          </article>
        </div>
      </section>

      <section className="sb-section" style={{ textAlign: 'center' }}>
        <div className="sb-sectionHead">
          <h2>Our Story</h2>
          <p style={{ maxWidth: '700px', margin: '20px auto', color: 'var(--color-text-muted)', textTransform: 'none', letterSpacing: 'normal', lineHeight: '1.8' }}>
            Started by a group of passionate developers and students, SkillBridge is designed to solve the isolation 
            of modern online learning. By combining AI precision with human empathy, we create a space where 
            asking a doubt is the first step toward mastery.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
