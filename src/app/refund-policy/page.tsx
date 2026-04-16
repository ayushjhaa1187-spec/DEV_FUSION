'use client';

import LegalTemplate from '@/components/layout/LegalTemplate';
import { RefreshCw } from 'lucide-react';

export default function RefundPage() {
  const sections = [
    {
      title: 'Course Refunds',
      content: [
        'Refunds for digital courses are available within 48 hours of purchase, provided that less than 10% of the content has been accessed.',
        'Request for refunds after the 48-hour window will be evaluated on a case-by-case basis.'
      ]
    },
    {
      title: 'Mentor Session Refunds',
      content: [
        'Cancellations for mentor sessions must be made at least 12 hours before the scheduled start time for a full refund of credits.',
        'No-shows or late cancellations are not eligible for refunds.'
      ]
    }
  ];

  return <LegalTemplate title="Refund Policy" lastUpdated="April 2026" icon={RefreshCw} sections={sections} />;
}
