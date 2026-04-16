import type { Metadata } from 'next';
import './globals.css';
// Components
import ConditionalNavbar, { ConditionalFooter } from '@/components/layout/ConditionalNavbar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Providers from '@/components/providers';
import { NotificationToastProvider } from '@/components/providers/NotificationToastProvider';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'SkillBridge — Learn. Earn. Grow.',
  description:
    'SkillBridge is a college-focused platform for resolving doubts, connecting with mentors, and growing through community learning.',
  keywords: ['education', 'mentorship', 'doubt resolution', 'college', 'student learning'],
  authors: [{ name: 'SkillBridge Team' }],
  openGraph: {
    title: 'SkillBridge — Learn. Earn. Grow.',
    description: 'Resolve doubts, connect with mentors, and grow through community learning.',
    url: 'https://dev-fusion-dun.vercel.app',
    siteName: 'SkillBridge',
    images: [
      {
        url: 'https://dev-fusion-dun.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SkillBridge Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillBridge — Learn. Earn. Grow.',
    description: 'Resolve doubts, connect with mentors, and grow through community learning.',
    images: ['https://dev-fusion-dun.vercel.app/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
      </head>
      <body className="antialiased">
        <Providers>
          <NotificationToastProvider>
            <div className="flex flex-col min-h-screen">
              <ConditionalNavbar />
              <main className="flex-grow pb-24 md:pb-0">{children}</main>
              <ConditionalFooter />
              <MobileBottomNav />
            </div>
          </NotificationToastProvider>
          <Toaster richColors position="top-right" theme="dark" />
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
