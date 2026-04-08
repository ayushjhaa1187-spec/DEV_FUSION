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

    const fetchInitialUnread = async () => {
      try {
        const data = await notificationApi.getNotifications();
        const unread = data?.filter((n: any) => !n.is_read).length || 0;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to fetch unread notifications');
      }
    };
    fetchInitialUnread();

    // 🚀 RESTORED REALTIME: Supabase Notification Subscription
    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`user-notifications:${user.id}`)
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
                <Link href="/notifications" className={styles.icon}>🔔</Link>
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
              </div>
              <Link href="/profile" className={styles.userNameLink}>
                <span className={styles.userName}>{user.username || user.email?.split('@')[0]}</span>
              </Link>
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

