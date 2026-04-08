'use client';

import Link from 'next/link';
import styles from './page.module.css';
import '../globals.css';

export const metadata = {
  title: 'Terms of Service | SkillBridge',
  description: 'SkillBridge Terms of Service - Rules and guidelines for using our platform.',
};

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: [
      'By accessing or using SkillBridge, you agree to be bound by these Terms of Service.',
      'If you do not agree to these terms, please do not use our services.',
      'We reserve the right to modify these terms at any time.',
    ],
  },
  {
    title: '2. Account Registration',
    content: [
      'You must create an account to access certain features of the platform.',
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'You agree to provide accurate and complete information during registration.',
    ],
  },
  {
    title: '3. User Conduct',
    content: [
      'You agree not to misuse the platform or engage in any illegal activities.',
      'Harassment, spam, or harmful content is strictly prohibited.',
      'You must not attempt to bypass security measures or access unauthorized areas.',
    ],
  },
  {
    title: '4. Intellectual Property',
    content: [
      'All content on SkillBridge is owned by SkillBridge or its licensors.',
      'You may not reproduce, distribute, or create derivative works without permission.',
      'User-generated content remains the property of the user but grants SkillBridge a license.',
    ],
  },
  {
    title: '5. Payment and Billing',
    content: [
      'Some features may require payment. All fees are non-refundable unless stated otherwise.',
      'We may change pricing with advance notice to affected users.',
      'Users are responsible for all charges incurred under their account.',
    ],
  },
  {
    title: '6. Termination',
    content: [
      'We reserve the right to suspend or terminate accounts for violations of these terms.',
      'You may close your account at any time through your account settings.',
      'Upon termination, access to the platform will be immediately revoked.',
    ],
  },
  {
    title: '7. Disclaimer of Warranties',
    content: [
      'The platform is provided on an "as is" basis without warranties of any kind.',
      'We do not guarantee that the service will be uninterrupted or error-free.',
      'We are not liable for any damages resulting from the use of our services.',
    ],
  },
  {
    title: '8. Limitation of Liability',
    content: [
      'SkillBridge shall not be liable for any indirect, incidental, or consequential damages.',
      'Our total liability shall not exceed the amount paid by you for the service.',
      'These limitations apply regardless of the legal theory under which liability is sought.',
    ],
  },
  {
    title: '9. Governing Law',
    content: [
      'These terms are governed by the laws of India.',
      'Any disputes shall be resolved in the courts of the appropriate jurisdiction.',
      'Both parties agree to attempt good faith negotiation before pursuing legal action.',
    ],
  },
];

export default function TermsPage() {
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
          <h1 className={styles.pageTitle}>Terms of Service</h1>
          <p className={styles.pageSubtitle}>
            Last updated: January 1, 2025
          </p>
          <p className={styles.pageIntro}>
            Welcome to SkillBridge. These Terms of Service govern your use of
            our platform and services. Please read them carefully before using
            SkillBridge.
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
