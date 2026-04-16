'use client';

import LegalTemplate from '@/components/layout/LegalTemplate';
import { CreditCard } from 'lucide-react';

export default function PricingPage() {
  const sections = [
    {
      title: 'Course & Content Pricing',
      content: [
        'SkillBridge uses a credit-based system. Prices for specialized courses and mentor sessions are clearly displayed before purchase.',
        'All prices are listed in INR and are inclusive of applicable taxes unless stated otherwise.'
      ]
    },
    {
      title: 'Subscription Plans',
      content: [
        'Premium access plans provide monthly or annual access to exclusive cohorts and repositories.',
        'Subscription rates are subject to change with a 30-day notice to existing users.'
      ]
    }
  ];

  return <LegalTemplate title="Pricing Policy" lastUpdated="April 2026" icon={CreditCard} sections={sections} />;
}
