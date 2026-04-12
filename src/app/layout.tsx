import type { Metadata } from "next";
import { Space_Grotesk, Instrument_Serif } from 'next/font/google';
import "./globals.css";
import ConditionalNavbar, { ConditionalFooter } from '@/components/layout/ConditionalNavbar';
import Providers from '@/components/providers';
import ClientAIAssistant from '@/components/ClientAIAssistant';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
});

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
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${instrumentSerif.variable}`} style={{ colorScheme: 'dark' }}>
      <body>
        <Providers>
          <ConditionalNavbar />
          <main className="app-main">
            {children}
          </main>
          <ConditionalFooter />
          <ClientAIAssistant />
        </Providers>
      </body>
    </html>
  );
}
