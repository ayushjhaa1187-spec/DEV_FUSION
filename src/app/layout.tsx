import type { Metadata } from "next";
import "./globals.css";
import ConditionalNavbar from '@/components/layout/ConditionalNavbar';
import Providers from '@/components/providers';
import dynamic from 'next/dynamic';

const AIFloatingAssistant = dynamic(
  () => import('@/components/AIFloatingAssistant'),
  { ssr: false, loading: () => null }
);

export const metadata: Metadata = {
  title: "SkillBridge — Learn. Earn. Grow.",
  description: "SkillBridge is a college-focused platform for resolving doubts, connecting with mentors, and growing through community learning.",
  keywords: ["education", "mentorship", "doubt resolution", "college", "student learning"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <ConditionalNavbar />
          {children}
          <AIFloatingAssistant />
        </Providers>
      </body>
    </html>
  );
}
