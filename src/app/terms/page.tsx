'use client';

import LegalTemplate from '@/components/layout/LegalTemplate';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      title: 'Platform Access',
      content: [
        'SkillBridge provides a peer-learning ecosystem. By accessing the platform, you agree to maintain academic integrity and professional conduct.',
        'Users found engaging in plagiarism or harassment will have their reputation revoked and accounts suspended.'
      ]
    },
    {
      title: 'Mentorship Agreement',
      content: [
        'Mentorship interactions are peer-to-peer. SkillBridge is a facilitator and does not guarantee specific employment outcomes.',
        'Users are responsible for the quality and accuracy of the advice shared within the network.'
      ]
    }
  ];

  return <LegalTemplate title="Terms of Service" lastUpdated="April 2026" icon={FileText} sections={sections} />;
}
