import type { Metadata } from "next";
import "./globals.css";
import ConditionalNavbar from '@/components/layout/ConditionalNavbar';
import { AuthProvider } from '@/components/auth/auth-provider';
import AIFloatingAssistant from '@/components/AIFloatingAssistant';

export const metadata: Metadata = {
  title: "SkillBridge — Learn. Earn. Grow.",
  description: "SkillBridge is a college-focused platform for resolving doubts, connecting with mentors, and growing through community learning.",
  keywords: ["education", "mentorship", "doubt resolution", "college", "student learning"],
};

import { ToastProvider } from '@/components/ui/Toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <ConditionalNavbar />
            <AIFloatingAssistant />
            <main>
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
