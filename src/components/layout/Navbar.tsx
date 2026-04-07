'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { notificationApi } from '@/lib/api';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const { count } = await notificationApi.getUnreadCount();
          setUnreadCount(count);
        } catch (err) {
          // Ignore
        }
      };
      fetchUnread();
    }
  }, [user]);

  return (
    <nav className={`${styles.navbar} glass`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>SKILL</span>
          <span className={styles.logoHighlight}>BRIDGE</span>
        </Link>
        <div className={styles.links}>
          <Link href="/doubts" className={styles.link}>Doubts</Link>
          <Link href="/mentors" className={styles.link}>Mentors</Link>
          <Link href="/tests" className={styles.link}>Practice</Link>
        </div>
        <div className={styles.actions}>
          {user ? (
            <div className={styles.userSection}>
              <div className={styles.notificationWrapper}>
                <span className={styles.icon}>🔔</span>
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
              </div>
              <span className={styles.userName}>{user.name || user.email?.split('@')[0]}</span>
              <button onClick={() => signOut()} className={styles.logoutBtn}>Logout</button>
            </div>
          ) : (
            <>
              <Link href="/auth" className={styles.loginBtn}>Login</Link>
              <Link href="/auth" className={styles.signupBtn}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

