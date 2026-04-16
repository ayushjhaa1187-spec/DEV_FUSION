'use client';

import LegalTemplate from '@/components/layout/LegalTemplate';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      title: 'Information Collection',
      content: [
        'We collect information you provide directly to us, including identity data, contact details, and technical profile information when you register for SkillBridge.',
        'Usage data is automatically collected to optimize your learning experience and maintain platform security.'
      ]
    },
    {
      title: 'Data Usage',
      content: [
        'Your data is primarily used to facilitate mentorship connections, track learning progress, and award reputation points.',
        'We use analytics to improve our course recommendations and platform performance.'
      ]
    },
    {
      title: 'Third-Party Sharing',
      content: [
        'We do not sell your personal data. Information is shared with verified mentors and organizations only when you explicitly interact with their content.',
        'Service providers (like Supabase and Vercel) may process data to keep the platform operational.'
      ]
    }
  ];

  return <LegalTemplate title="Privacy Policy" lastUpdated="April 2026" icon={Shield} sections={sections} />;
}
