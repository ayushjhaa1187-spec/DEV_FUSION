import type { Metadata } from 'next';
import './globals.css';
import ConditionalNavbar, { ConditionalFooter } from '@/components/layout/ConditionalNavbar';
import Providers from '@/components/providers';
import ClientAIAssistant from '@/components/ClientAIAssistant';
import { Suspense } from 'react';
import DailyStreakTracker from '@/components/auth/DailyStreakTracker';
import { Toaster } from 'sonner';
import Script from 'next/script';

export const metadata: Metadata = {
// ... existing metadata ...
  title: 'SkillBridge — Learn. Earn. Grow.',
  description:
    'SkillBridge is a college-focused platform for resolving doubts, connecting with mentors, and growing through community learning.',
  keywords: ['education', 'mentorship', 'doubt resolution', 'college', 'student learning'],
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
          <Suspense fallback={null}>
            <DailyStreakTracker />
          </Suspense>
          <ConditionalNavbar />
          <main className="app-main">{children}</main>
          <ConditionalFooter />
          <ClientAIAssistant />
          <Toaster richColors position="top-right" theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
