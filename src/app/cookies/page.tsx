
import Link from 'next/link';
import styles from './page.module.css';
import '../globals.css';

export const metadata = {
  title: 'Cookie Policy | SkillBridge',
  description: 'SkillBridge Cookie Policy - How we use cookies on our platform.',
};

const sections = [
  {
    title: 'What Are Cookies?',
    content: [
      'Cookies are small text files that are stored on your device when you visit a website.',
      'They help websites remember your preferences, analyze traffic, and improve user experience.',
    ],
  },
  {
    title: 'Types of Cookies We Use',
    content: [
      'Essential Cookies: Required for the website to function properly.',
      'Analytics Cookies: Help us understand how visitors use our platform.',
      'Preference Cookies: Remember your settings and preferences.',
      'Marketing Cookies: Used to deliver relevant content and advertisements.',
    ],
  },
  {
    title: 'How We Use Cookies',
    content: [
      'To keep you logged in and maintain your session.',
      'To remember your preferences and customization choices.',
      'To analyze site traffic and improve our services.',
      'To deliver personalized content and recommendations.',
    ],
  },
  {
    title: 'Third-Party Cookies',
    content: [
      'We may use third-party services that set cookies on your device.',
      'These include analytics providers, advertising networks, and social media platforms.',
      'Third-party cookies are subject to their respective privacy policies.',
    ],
  },
  {
    title: 'Managing Cookies',
    content: [
      'You can control cookies through your browser settings.',
      'Most browsers allow you to block, delete, or manage cookies.',
      'Disabling certain cookies may affect the functionality of our platform.',
    ],
  },
  {
    title: 'Updates to This Policy',
    content: [
      'We may update this Cookie Policy from time to time.',
      'Any changes will be reflected on this page with an updated date.',
    ],
  },
];

export default function CookiesPage() {
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
          <h1 className={styles.pageTitle}>Cookie Policy</h1>
          <p className={styles.pageSubtitle}>Last updated: January 1, 2025</p>
          <p className={styles.pageIntro}>
            This Cookie Policy explains how SkillBridge uses cookies and similar
            technologies on our platform. We use cookies to enhance your
            experience and improve our services.
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
