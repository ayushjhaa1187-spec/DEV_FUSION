import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy | DEV_FUSION',
  description: 'DEV_FUSION Cookie Policy - How we use cookies on our platform.',
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
      'We may use third-party services that set their own cookies on your device.',
      'These include analytics providers, advertising networks, and social media platforms.',
      'Third-party cookies are subject to the privacy policies of those services.',
    ],
  },
  {
    title: 'Managing Your Cookies',
    content: [
      'You can control and delete cookies through your browser settings.',
      'Disabling cookies may affect the functionality of certain features.',
      'You can opt out of analytics cookies through our privacy settings.',
    ],
  },
  {
    title: 'Cookie Retention',
    content: [
      'Session cookies are deleted when you close your browser.',
      'Persistent cookies remain on your device for a set period.',
      'You can delete all cookies at any time through your browser settings.',
    ],
  },
];

export default function CookiesPage() {
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
            Cookie Policy
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 12px' }}>Last updated: January 1, 2025</p>
          <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>
            This Cookie Policy explains how DEV_FUSION uses cookies and similar tracking technologies
            when you visit our platform.
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
