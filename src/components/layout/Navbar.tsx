'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Bell, Menu, X, MessageSquare, Trophy, AtSign, FileText } from 'lucide-react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count & setup realtime
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const res = await fetch('/api/notifications/unread');
      const data = await res.json();
      setUnreadCount(data.count || 0);
    };
    fetchUnread();

    const interval = setInterval(fetchUnread, 30000); // Poll every 30s

    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        setUnreadCount(prev => prev + 1);
        // Toast could be triggered here in Phase 3
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Handle outside click for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(data || []);
  };

  const handleNotifClick = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', { 
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true })
    });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#') && pathname === '/') {
      e.preventDefault();
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    } else if (href.startsWith('#')) {
      e.preventDefault();
      router.push(`/${href}`);
    }
    setIsMobileMenuOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'answer': return <MessageSquare size={16} />;
      case 'badge': return <Trophy size={16} />;
      case 'mention': return <AtSign size={16} />;
      case 'test': return <FileText size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link href="/" className={styles.logo}>
          <svg
            className={styles.logoIcon}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="SkillBridge logo"
          >
            <defs>
              <linearGradient id="sbLogoGradNav" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06d6a0" />
              </linearGradient>
            </defs>
            <path
              d="M4 28 Q20 8 36 28"
              stroke="url(#sbLogoGradNav)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <line
              x1="4"
              y1="28"
              x2="36"
              y2="28"
              stroke="url(#sbLogoGradNav)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line x1="13" y1="20" x2="13" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            <line x1="27" y1="20" x2="27" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="10.5" r="3" fill="#06d6a0" opacity=".95" />
            <circle cx="20" cy="10.5" r="6" fill="#06d6a0" opacity=".18" />
          </svg>
          <span className={styles.logoText}>
            Skill<span>Bridge</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className={styles.navLinks}>
          <Link href="/doubts" className={`${styles.navLink} ${pathname === '/doubts' ? styles.active : ''}`}>Doubts</Link>
          <Link href="/mentors" className={`${styles.navLink} ${pathname === '/mentors' ? styles.active : ''}`}>Mentors</Link>
          <Link href="/tests" className={`${styles.navLink} ${pathname === '/tests' ? styles.active : ''}`}>Practice</Link>
          {profile?.role === 'admin' && (
            <Link href="/admin/applications" className={`${styles.navLink} ${styles.adminLink} ${pathname.startsWith('/admin') ? styles.active : ''}`}>
              Admin
            </Link>
          )}
          <a href="#features" onClick={(e) => handleNavClick(e, '#features')} className={styles.navLink}>Features</a>
        </div>

        <div className={styles.navRight}>
          {user ? (
            <>
              <div className={styles.notifWrapper} ref={dropdownRef}>
                <button className={styles.notifyBtn} onClick={handleNotifClick}>
                  <Bell size={20} />
                  {unreadCount > 0 && <span className={styles.notifyBadge}>{unreadCount}</span>}
                </button>

                {isNotifOpen && (
                  <div className={styles.notifDropdown}>
                    <div className={styles.notifHeader}>
                      <span>Notifications</span>
                      <button onClick={markAllRead}>Mark all read</button>
                    </div>
                    <div className={styles.notifList}>
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className={`${styles.notifItem} ${!n.is_read ? styles.unread : ''}`}>
                          <span className={styles.notifIcon}>{getIcon(n.type)}</span>
                          <div className={styles.notifContent}>
                            <p>{n.message}</p>
                            <time>{timeAgo(n.created_at)}</time>
                          </div>
                        </div>
                      )) : (
                        <div className={styles.emptyNotif}>You're all caught up!</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/dashboard" className={styles.dashboardBtn}>Dashboard</Link>
              <button onClick={() => signOut()} className={styles.logoutBtn}>Logout</button>
            </>
          ) : (
            <div className={styles.authActions}>
              <Link href="/auth" className={styles.btnSecondary}>Sign In</Link>
              <Link href="/auth" className={styles.btnPrimary}>Get Started</Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button className={styles.mobileToggle} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className={styles.mobileDrawer}>
          <Link href="/doubts" onClick={() => setIsMobileMenuOpen(false)}>Doubts</Link>
          <Link href="/mentors" onClick={() => setIsMobileMenuOpen(false)}>Mentors</Link>
          <Link href="/tests" onClick={() => setIsMobileMenuOpen(false)}>Practice</Link>
          <a href="#features" onClick={(e) => handleNavClick(e, '#features')}>Features</a>
          {!user && <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>}
        </div>
      )}
    </nav>
  );
}
