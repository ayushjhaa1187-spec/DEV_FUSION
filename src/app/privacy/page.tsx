import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | DEV_FUSION',
  description: 'DEV_FUSION Privacy Policy - Learn how we collect, use, and protect your data.',
};

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      'We collect information you provide directly when you create an account, complete your profile, or communicate with us.',
      'This includes your name, email address, profile information, and any content you submit.',
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
      'If you have any questions about this Privacy Policy, please contact us at privacy@devfusion.com.',
      'You can also reach us through the contact form on our website.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', paddingTop: '90px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
        <Link
          href="/"
          style={{ color: '#8B5CF6', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}
        >
          ← Back to Home
        </Link>

        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '3px', color: '#8B5CF6', textTransform: 'uppercase', marginBottom: '12px' }}>
            DEV_FUSION
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 16px', background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 12px' }}>Last updated: January 1, 2025</p>
          <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>
            At DEV_FUSION, we take your privacy seriously. This policy explains how we collect, use, and protect
            your personal information when you use our platform.
          </p>
        </div>

        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '36px', padding: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#8B5CF6', marginBottom: '16px' }}>{section.title}</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {section.content.map((item, j) => (
                <li key={j} style={{ padding: '8px 0', color: '#94a3b8', lineHeight: 1.6, display: 'flex', gap: '10px', alignItems: 'flex-start', borderBottom: j < section.content.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ color: '#8B5CF6', flexShrink: 0, marginTop: '2px' }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
