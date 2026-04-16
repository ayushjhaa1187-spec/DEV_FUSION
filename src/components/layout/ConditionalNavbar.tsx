'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname?.startsWith('/auth');

  if (isLandingPage || isAuthPage) {
    return null;
  }

  return <Navbar />;
}

export function ConditionalFooter() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return null;
  }

  return <Footer />;
}
