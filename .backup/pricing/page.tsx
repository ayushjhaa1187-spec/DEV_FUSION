import PricingPageClient from './PricingPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans | DEV_FUSION',
  description: 'Invest in your academic edge with our transparent pricing plans. Built for students on a budget.',
  openGraph: {
    title: 'Pricing Plans | DEV_FUSION',
    description: 'Invest in your academic edge with our transparent pricing plans. Built for students on a budget.',
    type: 'website'
  }
};

export default function PricingPage() {
  return <PricingPageClient />;
}
