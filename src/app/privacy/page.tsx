
import Link from 'next/link';
import styles from './page.module.css';
import '../globals.css';

export const metadata = {
  title: 'Privacy Policy | SkillBridge',
  description: 'SkillBridge Privacy Policy - Learn how we collect, use, and protect your data.',
};

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      'We collect information you provide directly to us when you create an account, complete your profile, or communicate with us.',
      'This includes your name, email address, profile information, learning progress, and any content you submit.',
      'We also automatically collect certain information about your device and usage of our services.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: [
      'To provide, maintain, and improve our services.',
      'To personalize your learning experience and recommend relevant content.',
      'To communicate with you about your account, updates, and promotional content.',
      'To analyze usage patterns and improve our platform.',
    ],
  },
  {
    title: '3. Information Sharing',
    content: [
      'We do not sell your personal information to third parties.',
      'We may share information with service providers who assist in operating our platform.',
      'We may disclose information if required by law or to protect our rights.',
    ],
  },
  {
    title: '4. Data Security',
    content: [
      'We implement industry-standard security measures to protect your data.',
      'Access to your personal information is limited to authorized personnel.',
      'We regularly review our security practices and update them as needed.',
    ],
  },
  {
    title: '5. Your Rights',
    content: [
      'You have the right to access, update, or delete your personal information.',
      'You can opt-out of marketing communications at any time.',
      'You may request a copy of your data in a portable format.',
    ],
  },
  {
    title: '6. Cookies',
    content: [
      'We use cookies to enhance your experience on our platform.',
      'Cookies help us remember your preferences and analyze site traffic.',
      'You can control cookie settings through your browser preferences.',
    ],
  },
  {
    title: '7. Changes to This Policy',
    content: [
      'We may update this Privacy Policy from time to time.',
      'We will notify you of any significant changes via email or platform notification.',
      'Your continued use of the service constitutes acceptance of the updated policy.',
    ],
  },
  {
    title: '8. Contact Us',
    content: [
      'If you have any questions about this Privacy Policy, please contact us at privacy@skillbridge.com.',
      'You can also reach us through the contact form on our website.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageBg}>
        <div className={styles.pageGlow}></div>
      </div>
      <nav className={styles.pageNav}>
        <Link href="/" className={styles.backLink}>
          &larr; Back to Home
        </Link>
        <Link href="/" className={styles.logoLink}>SkillBridge</Link>
      </nav>
      <article className={styles.pageContent}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Privacy Policy</h1>
          <p className={styles.pageSubtitle}>
            Last updated: January 1, 2025
          </p>
          <p className={styles.pageIntro}>
            At SkillBridge, we take your privacy seriously. This policy explains
            how we collect, use, and protect your personal information when you
            use our platform.
          </p>
        </header>
        <div className={styles.pageSections}>
          {sections.map((section, i) => (
            <section key={i} className={styles.pageSection}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <ul className={styles.sectionList}>
                {section.content.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
