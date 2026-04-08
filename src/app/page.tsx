import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.meshBg}>
        <Image 
          src="/skillbridge_hero_mesh_1775619815600.png" 
          alt="Hero Background" 
          layout="fill" 
          objectFit="cover" 
          className={styles.heroImg}
          priority
        />
      </div>

      <main className={styles.heroSection}>
        <div className={styles.content}>
          <div className={styles.badge}>Next-Gen Peer Learning 🚀</div>
          <h1 className={styles.heroTitle}>
            Bridge the Gap in Your <span className={styles.accent}>Academic Journey.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Solve complex doubts with AI-first assistance, connect with expert student mentors, and test your knowledge with personalized quizzes. Built for college students, by college students.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/auth" className={styles.primaryBtn}>Get Started Free</Link>
            <Link href="/mentors" className={styles.secondaryBtn}>Find a Mentor</Link>
          </div>
          <div className={styles.socialProof}>
            <div className={styles.avatars}>
              {[1, 2, 3, 4].map(i => (
                <img 
                  key={i} 
                  src={`https://i.pravatar.cc/100?u=${i}`} 
                  className={styles.avatarMini} 
                  alt="user"
                />
              ))}
            </div>
            <p>Joined by <strong>2,000+</strong> students this semester.</p>
          </div>
        </div>
      </main>

      <section className={styles.featureGrid}>
        <div className={`${styles.featureCard} glass`}>
          <div className={styles.iconBox}>🦉</div>
          <h3>AI Doubt Hub</h3>
          <p>Instant Gemini Pro explanations for your toughest questions, 24/7.</p>
        </div>
        <div className={`${styles.featureCard} glass`}>
          <div className={styles.iconBox}>💎</div>
          <h3>Reputation System</h3>
          <p>Earn points for helping others and build your academic credibility.</p>
        </div>
        <div className={`${styles.featureCard} glass`}>
          <div className={styles.iconBox}>📅</div>
          <h3>Expert Mentors</h3>
          <p>Book 1:1 sessions with verified students who have mastered the coursework.</p>
        </div>
      </section>
    </div>
  );
}
