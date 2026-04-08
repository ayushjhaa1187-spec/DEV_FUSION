import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | DEV_FUSION',
  description: 'DEV_FUSION Terms of Service - Rules and guidelines for using our platform.',
};

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: [
      'By accessing or using DEV_FUSION, you agree to be bound by these Terms of Service.',
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
      'All content on DEV_FUSION is owned by DEV_FUSION or its licensors.',
      'You may not reproduce, distribute, or create derivative works without permission.',
      'User-generated content remains the property of the user but grants DEV_FUSION a license.',
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
      'DEV_FUSION shall not be liable for any indirect, incidental, or consequential damages.',
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
            Terms of Service
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 12px' }}>Last updated: January 1, 2025</p>
          <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>
            Welcome to DEV_FUSION. These Terms of Service govern your use of our platform and services.
            Please read them carefully before using DEV_FUSION.
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
