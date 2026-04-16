'use client';

import LegalTemplate from '@/components/layout/LegalTemplate';
import { Lock } from 'lucide-react';

export default function CookiePage() {
  const sections = [
    {
      title: 'Cookie Usage',
      content: [
        'We use essential cookies to maintain your authentication session and security.',
        'Analytics cookies help us understand how you interact with our courses and mentors to improve the UI/UX.'
      ]
    },
    {
      title: 'Managing Preferences',
      content: [
        'You can manage your cookie preferences through your browser settings. However, disabling essential cookies will prevent platform access.'
      ]
    }
  ];

  return <LegalTemplate title="Cookie Policy" lastUpdated="April 2026" icon={Lock} sections={sections} />;
}
