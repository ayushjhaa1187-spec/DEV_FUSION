'use client';

import LegalTemplate from '@/components/layout/LegalTemplate';
import { Truck } from 'lucide-react';

export default function ShippingPage() {
  const sections = [
    {
      title: 'Digital Delivery',
      content: [
        'All courses, resources, and mentorship access are delivered digitally via the SkillBridge platform immediately upon successful transaction.',
        'Access credentials and enrollment details will be sent to your registered email address.'
      ]
    },
    {
      title: 'Physical Goods',
      content: [
        'SkillBridge primarily provides digital services. In the case of physical welcome kits or certificates, shipping is handled via national courier services within 7-10 working days.',
        'Tracking information will be provided once the item is dispatched.'
      ]
    }
  ];

  return <LegalTemplate title="Shipping Policy" lastUpdated="April 2026" icon={Truck} sections={sections} />;
}
