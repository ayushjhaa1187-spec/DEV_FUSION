import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "SkillBridge | Peer Learning & Doubt Resolution Ecosystem",
  description: "SkillBridge is a college-focused platform for resolving doubts, connecting with mentors, and growing through community learning.",
  keywords: ["education", "mentorship", "doubt resolution", "college", "student learning"],
};

import { AuthProvider } from '@/components/auth/auth-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ marginTop: '72px' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}


