import type { Metadata } from "next";
import "./globals.css";
import ConditionalNavbar from '@/components/layout/ConditionalNavbar';
import { AuthProvider } from '@/components/auth/auth-provider';
import AIFloatingAssistant from '@/components/AIFloatingAssistant';

export const metadata: Metadata = {
  title: "SkillBridge | Peer Learning & Doubt Resolution Ecosystem",
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
    <html lang="en">
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


