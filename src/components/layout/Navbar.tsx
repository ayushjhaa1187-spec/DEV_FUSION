'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { Bell, Menu, X, MessageSquare, Trophy, AtSign, FileText, ChevronRight } from 'lucide-react';
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

  const mainLinks = [
    { name: 'Doubts', href: '/doubts' },
    { name: 'Mentors', href: '/mentors' },
    { name: 'Practice', href: '/tests' },
    { name: 'Resources', href: '/resources' },
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

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link href="/" className={styles.logo}>
          <svg className={styles.logoIcon} viewBox="0 0 40 40" fill="none">
            <path d="M4 28 Q20 8 36 28" stroke="url(#sbLogoGradNav)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <line x1="4" y1="28" x2="36" y2="28" stroke="url(#sbLogoGradNav)" strokeWidth="2.5" />
            <defs>
              <linearGradient id="sbLogoGradNav" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#06d6a0" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.logoText}>Skill<span>Bridge</span></span>
        </Link>

        {/* Desktop Links */}
        <div className={styles.navLinks}>
          {mainLinks.map(link => (
            <Link key={link.href} href={link.href} className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}>
              {link.name}
              {pathname === link.href && (
                <motion.div layoutId="underline" className={styles.underline} />
              )}
            </Link>
          ))}
        </div>

        <div className={styles.navRight}>
          {user ? (
            <div className="flex items-center gap-4">
              <div className={styles.notifWrapper} ref={dropdownRef}>
                <button className={styles.notifyBtn} onClick={() => setIsNotifOpen(!isNotifOpen)}>
                  <Bell size={20} />
                  {unreadCount > 0 && <span className={styles.notifyBadge}>{unreadCount}</span>}
                </button>
              </div>
              <Link href="/dashboard" className={styles.avatarBtn}>
                <div className={styles.avatar}>
                   {profile?.avatar_url ? (
                     <img src={profile.avatar_url} alt="" />
                   ) : (
                     <span>{profile?.full_name?.[0] || 'U'}</span>
                   )}
                </div>
              </Link>
            </div>
          ) : (
            <div className={styles.authActions}>
              <Link href="/auth" className={styles.btnSecondary}>Sign In</Link>
              <Link href="/auth" className={styles.btnPrimary}>Start Free</Link>
            </div>
          )}

          <button className={styles.mobileToggle} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.mobileDrawer}
          >
            <div className={styles.mobileDrawerContent}>
              <div className={styles.mobileUserInfo}>
                <div className={styles.mobileAvatarLarge}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : profile?.full_name?.[0]}
                </div>
                <div>
                  <h3 className="font-black">{profile?.full_name || 'Student'}</h3>
                  <p className="text-xs text-gray-500">@{profile?.username || 'learner'}</p>
                </div>
              </div>

              <div className="space-y-4">
                {mainLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link 
                      href={link.href} 
                      className={styles.mobileNavLink}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                      <ChevronRight size={16} className="text-gray-700" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
                 <Link href="/dashboard" className="block w-full text-center py-4 bg-white/5 rounded-2xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>
                   Dashboard
                 </Link>
                 <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="w-full text-center py-4 text-red-400 font-bold border border-red-400/20 rounded-2xl">
                   Logout
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
