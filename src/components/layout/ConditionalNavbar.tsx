'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/auth';

  if (isLandingPage || isAuthPage) {
    return null;
  }

  return <Navbar />;
}
