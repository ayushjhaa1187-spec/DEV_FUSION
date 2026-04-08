'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { notificationApi } from '@/lib/api';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          if (payload.new?.user_id === user.id) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    notificationApi
      .getUnreadCount()
      .then((data: any) => {
        const count = typeof data === 'number' ? data : (data?.count ?? data?.unread_count ?? 0);
        setUnreadCount(count);
      })
      .catch(() => setUnreadCount(0));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.logo}>
          <Link href="/" className={styles.logoLink}>
            <svg
              className={styles.logoSvg}
              viewBox="0 0 280 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="DEV_FUSION Logo"
            >
              <defs>
                <linearGradient id="navLogoGrad" x1="0" y1="0" x2="280" y2="44" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
                <filter id="navLogoGlow" x="-20%" y="-40%" width="140%" height="180%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#navLogoGlow)">
                <path
                  d="M8 6 L22 22 L8 38 M8 22 H30"
                  stroke="url(#navLogoGrad)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="33" cy="22" r="4" fill="url(#navLogoGrad)" />
                <text
                  x="46"
                  y="28"
                  fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                  fontSize="20"
                  fontWeight="800"
                  fill="url(#navLogoGrad)"
                  letterSpacing="1"
                >
                  DEV_FUSION
                </text>
              </g>
              <text
                x="46"
                y="40"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="7"
                fontWeight="400"
                fill="#64748b"
                letterSpacing="3.5"
              >
                BUILD • INNOVATE • SCALE
              </text>
            </svg>
          </Link>
        </div>

        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/projects" className={styles.navLink}>Projects</Link>
          <Link href="/mentors" className={styles.navLink}>Mentors</Link>
          <Link href="/doubts" className={styles.navLink}>Doubts</Link>
          <Link href="/blogs" className={styles.navLink}>Blog</Link>
        </div>

        <div className={styles.navRight}>
          <button className={styles.notifyBtn} aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {unreadCount > 0 && (
              <span className={styles.notifyBadge}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {user ? (
            <>
              <Link href="/dashboard" className={styles.btn}>Dashboard</Link>
              <button onClick={() => signOut()} className={styles.btnSecondary}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className={styles.btnSecondary}>Sign In</Link>
              <Link href="/auth/signup" className={styles.btn}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
