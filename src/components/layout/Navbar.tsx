'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { Bell, Menu, X, MessageSquare, Trophy, AtSign, FileText, ChevronRight, Check } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mainLinks = [
    { name: 'Doubts', href: '/doubts' },
    { name: 'Mentors', href: '/mentors' },
    { name: 'Courses', href: '/courses' },
    { name: 'Community', href: '/community' },
    { name: 'Practice', href: '/tests' },
    { name: 'Leaderboard', href: '/leaderboard' },
  ];

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const res = await fetch('/api/notifications/unread');
      const data = await res.json();
      setUnreadCount(data.count || 0);
    };
    fetchUnread();

    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => setUnreadCount(prev => prev + 1))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openNotifications = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && user) {
      setNotifLoading(true);
      try {
        const res = await fetch('/api/notifications?limit=10');
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
        // Mark all as read
        await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) });
        setUnreadCount(0);
      } finally {
        setNotifLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>Skill Bridge</Link>

        {/* Desktop Links */}
        <nav className={styles.desktopLinks}>
          {mainLinks.map(link => (
            <Link key={link.href} href={link.href} className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}>
              {link.name}
              {pathname === link.href && (
                <motion.span className={styles.activeIndicator} layoutId="activeNav" />
              )}
            </Link>
          ))}
        </nav>

        {user ? (
          <div className={styles.userActions}>
            {/* Notification Bell */}
            <div className={styles.notifWrapper} ref={dropdownRef}>
              <button className={styles.iconBtn} onClick={openNotifications} aria-label="Notifications">
                <Bell size={20} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    className={styles.notifDropdown}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className={styles.notifHeader}>
                      <span>Notifications</span>
                      <button
                        className={styles.markReadBtn}
                        onClick={async () => {
                          await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) });
                          setUnreadCount(0);
                          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                        }}
                      >
                        <Check size={12} /> Mark all read
                      </button>
                    </div>
                    <div className={styles.notifList}>
                      {notifLoading ? (
                        <div className={styles.notifEmpty}>Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className={styles.notifEmpty}>No notifications yet</div>
                      ) : (
                        notifications.map(notif => (
                          <Link
                            key={notif.id}
                            href={notif.link || '/doubts'}
                            className={`${styles.notifItem} ${!notif.is_read ? styles.notifUnread : ''}`}
                            onClick={() => setIsNotifOpen(false)}
                          >
                            <div className={styles.notifDot} />
                            <p className={styles.notifMsg}>{notif.message}</p>
                            <span className={styles.notifTime}>{new Date(notif.created_at).toLocaleDateString()}</span>
                          </Link>
                        ))
                      )}
                    </div>
                    <Link href="/notifications" className={styles.notifFooter} onClick={() => setIsNotifOpen(false)}>
                      View all notifications
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            {profile?.avatar_url ? (
              <Link href="/dashboard"><img src={profile.avatar_url} alt="avatar" className={styles.avatar} /></Link>
            ) : (
              <Link href="/dashboard"><div className={styles.avatarPlaceholder}>{profile?.full_name?.[0] || 'U'}</div></Link>
            )}
          </div>
        ) : (
          <div className={styles.authButtons}>
            <Link href="/login" className={styles.signInBtn}>Sign In</Link>
            <Link href="/register" className={styles.startFreeBtn}>Start Free</Link>
          </div>
        )}

        <button className={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          className={styles.mobileMenu}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className={styles.mobileProfile}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className={styles.avatarLg} /> : <div className={styles.avatarPlaceholderLg}>{profile?.full_name?.[0]}</div>}
            <div>
              <h3 className={styles.mobileProfileName}>{profile?.full_name || 'Student'}</h3>
              <p className={styles.mobileProfileUser}>@{profile?.username || 'learner'}</p>
            </div>
          </div>
          {mainLinks.map((link, i) => (
            <Link key={link.href} href={link.href} className={styles.mobileLink} onClick={() => setIsMobileMenuOpen(false)}>
              {link.name}
            </Link>
          ))}
          <Link href="/dashboard" className={styles.mobileLink} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
          <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="w-full text-center py-4 text-red-400 font-bold border border-red-400/20 rounded-2xl">Logout</button>
        </motion.div>
      )}
    </header>
  );
}
