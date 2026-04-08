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
        (payload) => {
          if (payload.new.user_id === user.id) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    notificationApi.getUnreadCount().then(setUnreadCount);

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
              viewBox="0 0 120 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="logoGradient"
                  x1="0"
                  y1="0"
                  x2="120"
                  y2="40"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#38B2AC" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#logoGlow)">
                <path
                  d="M10 5 L25 20 L10 35 M10 20 H35"
                  stroke="url(#logoGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="38" cy="20" r="4" fill="url(#logoGradient)" />
                <path
                  d="M55 8 L55 32 M48 15 L55 8 L62 15 M48 25 L55 32 L62 25"
                  stroke="url(#logoGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <text
                  x="75"
                  y="26"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="18"
                  fontWeight="700"
                  fill="url(#logoGradient)"
                  letterSpacing="1.5"
                >
                  DEV_FUSION
                </text>
              </g>
              <text
                x="75"
                y="37"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="6"
                fontWeight="400"
                fill="#94a3b8"
                letterSpacing="3"
              >
                BUILD • INNOVATE • SCALE
              </text>
            </svg>
          </Link>
        </div>

        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/projects" className={styles.navLink}>
            Projects
          </Link>
          <Link href="/mentors" className={styles.navLink}>
            Mentors
          </Link>
          <Link href="/blogs" className={styles.navLink}>
            Blogs
          </Link>
        </div>

        <div className={styles.navRight}>
          <button className={styles.notifyBtn}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 2C8.5 2 7.2 2.9 6.6 4.2C6.3 4.8 6.1 5.4 6.1 6.1L6.1 9.4C6.1 10.3 5.7 11.1 5.1 11.6L4.6 12.1C4.2 12.5 4 13.1 4 13.7C4 14.5 4.7 15.2 5.5 15.2L14.5 15.2C15.3 15.2 16 14.5 16 13.7C16 13.1 15.8 12.5 15.4 12.1L14.9 11.6C14.3 11.1 13.9 10.3 13.9 9.4L13.9 6.1C13.9 5.4 13.7 4.8 13.4 4.2C12.8 2.9 11.5 2 10 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10 16.5C8.5 16.5 7.3 17.5 7 18.5H13C12.7 17.5 11.5 16.5 10 16.5Z"
                fill="currentColor"
              />
            </svg>
            {unreadCount > 0 && (
              <span className={styles.notifyBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {user ? (
            <>
              <Link href="/dashboard" className={styles.btn}>
                Dashboard
              </Link>
              <button onClick={() => signOut()} className={styles.btnSecondary}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className={styles.btnSecondary}>
                Sign In
              </Link>
              <Link href="/auth/signup" className={styles.btn}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
