'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  Bell, Menu, X, MessageSquare, Trophy, FileText, 
  ChevronRight, User, Search, Command, ShieldAlert, Award, Star
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import SearchModal from './SearchModal';
import styles from './Navbar.module.css';
import SkillBridgeIcon from '@/components/ui/SkillBridgeIcon';

/**
 * Navbar component for SkillBridge Lean MVP
 * Standardized navigation for the core Student Success loop.
 */
export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Lean MVP Primary Navigation
  // Dynamic Navigation based on Auth State
  const getMainLinks = () => {
    if (!user) {
      return [
        { name: 'Features', href: '/#features' },
        { name: 'Mentors', href: '/mentors' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'University Hubs', href: '/organization' },
        { name: 'Verification', href: '/verify' },
      ];
    }

    const links = [
      { name: 'Resources', href: '/resources' },
      { name: 'Doubts', href: '/doubts' },
      { name: 'Practice', href: '/tests' },
    ];

    // Role-specific entry points
    if (profile?.role === 'mentor') {
      links.push({ name: 'Mentor Hub', href: '/mentors/dashboard' });
    }
    
    if (profile?.role === 'org' || profile?.role === 'admin' || profile?.organization_id) {
      links.push({ name: 'Org Hub', href: '/organization/dashboard' });
    }

    if (profile?.role === 'admin') {
      links.push({ name: 'Admin Central', href: '/admin' });
    }

    links.push(
      { name: 'Mentors', href: '/mentors' },
      { name: 'Community', href: '/community' },
      { name: 'Certificates', href: '/certificates' },
      { name: 'Leaderboard', href: '/leaderboard' }
    );

    return links;
  };

  const mainLinks = getMainLinks();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname === '/') return null;

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href={user ? "/dashboard" : "/"} className={styles.logo}>
            <SkillBridgeIcon className={styles.logoIcon} />
            <span className={styles.logoText}>Skill<span>Bridge</span></span>
          </Link>
 
          {/* Desktop Links */}
          <nav className={styles.desktopLinks}>
            {mainLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${pathname.startsWith(link.href) ? styles.active : ''}`}
              >
                {link.name}
                {pathname.startsWith(link.href) && (
                  <motion.span
                    layoutId="navbar-active"
                    className={styles.activeIndicator}
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
          </nav>
 
          <div className={styles.navRight}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSearchOpen(true)}
              className={styles.searchToggle}
            >
              <Search size={18} />
              <span className="hidden lg:inline ml-2 text-xs font-bold opacity-50">Search...</span>
            </motion.button>
 
            {user ? (
              <div className="flex items-center gap-5">
                <NotificationBell userId={user?.id} />
 
                <div className={styles.profileWrapper} ref={profileDropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={styles.avatarBtn}
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                  >
                    <div className={styles.avatar}>
                      {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="Avatar" width={42} height={42} />
                      ) : (
                        <span>{profile?.full_name?.[0] || user?.email?.[0] || 'U'}</span>
                      )}
                    </div>
                  </motion.button>
 
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={styles.dropdown}
                      >
                        <div className={styles.dropdownHeader}>
                          <p className={styles.dropdownName}>{profile?.full_name || 'Student'}</p>
                          <p className={styles.dropdownEmail}>{user?.email}</p>
                        </div>
                        <div className={styles.divider} />
                        <Link href="/dashboard" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                           Dashboard Central
                        </Link>
                        <Link href="/billing" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                           Billing & Plans
                        </Link>
                        <Link href="/settings" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                           Settings
                        </Link>
                        <div className={styles.divider} />
                        <button className={`${styles.dropdownItem} ${styles.logout}`} onClick={async () => { await signOut(); setIsProfileOpen(false); }}>
                          Logout System
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth" className="text-sm font-bold opacity-60 hover:opacity-100 transition-all">Sign In</Link>
                <Link href="/auth" className="sb-btn-primary px-5 py-2 text-xs">Join Hub</Link>
              </div>
            )}
 
            <button className={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>
 
      {/* 📱 Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={styles.mobileDrawer}
          >
            <div className={styles.mobileDrawerContent}>
              <div className="flex justify-between items-center mb-10">
                <span className="text-xl font-black uppercase tracking-tighter">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)}><X size={28} /></button>
              </div>
 
              <div className="flex flex-col gap-6">
                {mainLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className={styles.mobileNavLink}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                      <ChevronRight size={24} className="opacity-20" />
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile Personal Section */}
                {user && (
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                    <p className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Personal Command</p>
                    <Link href="/profile" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                      My Profile
                      <User size={20} className="opacity-20" />
                    </Link>
                    <Link href="/settings" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                      Identity Settings
                      <ShieldAlert size={20} className="opacity-20" />
                    </Link>
                    <Link href="/profile" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                      Notifications
                      <Bell size={20} className="opacity-20" />
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-10">
                {user ? (
                   <button onClick={async () => { await signOut(); setIsMobileMenuOpen(false); }} className="w-full sb-btn-secondary py-4 font-black uppercase tracking-widest text-xs">Shutdown Session</button>
                ) : (
                   <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="w-full sb-btn-primary py-4 text-center font-black uppercase tracking-widest text-xs">Initialize Access</Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
