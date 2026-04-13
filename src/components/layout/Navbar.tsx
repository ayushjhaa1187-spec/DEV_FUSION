'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { Bell, Menu, X, MessageSquare, Trophy, AtSign, FileText, ChevronRight, Check, User, Search, Command } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { NotificationBell } from './NotificationBell';
import SearchModal from './SearchModal';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const mainLinks = [
    { name: 'Doubts', href: '/doubts' },
    { name: 'Mentors', href: '/mentors' },
    { name: 'Courses', href: '/courses' },
    { name: 'Community', href: '/community' },
    { name: 'Practice', href: '/tests' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Organizations', href: '/organizations' },
  ];

  // Cmd+K search listener
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


  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  // Hide Navbar on landing page
  if (pathname === '/') return null;

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.logo}>
            <svg className={styles.logoIcon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="navLogoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#06d6a0" />
                </linearGradient>
                <filter id="navGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <path d="M4 28 Q20 8 36 28" stroke="url(#navLogoGrad)" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#navGlow)" />
              <line x1="4" y1="28" x2="36" y2="28" stroke="url(#navLogoGrad)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="13" y1="20" x2="13" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
              <line x1="27" y1="20" x2="27" y2="28" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
              <circle cx="20" cy="10.5" r="3" fill="#06d6a0" opacity="0.9" />
              <circle cx="20" cy="10.5" r="5.5" fill="#06d6a0" opacity="0.2" />
            </svg>
            <span className={styles.logoText}>Skill<span>Bridge</span></span>
          </Link>

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

          <div className={styles.navRight}>
            {/* Search Trigger */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 group px-4 py-2 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all"
            >
              <Search size={18} className="text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-gray-500 text-xs font-bold hidden md:inline group-hover:text-gray-300">Search...</span>
              <div className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-[9px] text-gray-500 font-black">
                <Command size={8} /> K
              </div>
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <NotificationBell userId={user.id} />

                <div className={styles.profileWrapper} ref={profileDropdownRef}>
                  <button className={styles.avatarBtn} onClick={() => { setIsProfileOpen(!isProfileOpen); }}>
                    <div className={styles.avatar}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" />
                      ) : (
                        <span>{profile?.full_name?.[0] || 'U'}</span>
                      )}
                    </div>
                  </button>
                  
                  <AnimatePresence mode="wait">
                    {isProfileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={styles.dropdown}
                      >
                        <div className={styles.dropdownHeader}>
                          <p className={styles.dropdownName}>{profile?.full_name || 'Student'}</p>
                          <p className={styles.dropdownEmail}>{user.email}</p>
                        </div>
                        <div className={styles.divider} />
                        <Link href={`/u/${profile?.username}`} className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                          <User size={16} /> My Public Profile
                        </Link>
                        <Link href="/dashboard" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                          <Trophy size={16} /> Dashboard
                        </Link>
                        <Link href="/settings" className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>
                          <FileText size={16} /> Settings
                        </Link>
                        <div className={styles.divider} />
                        <button className={`${styles.dropdownItem} ${styles.logout}`} onClick={() => { signOut(); setIsProfileOpen(false); }}>
                          <X size={16} /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className={styles.authActions}>
                <Link href="/auth" className={styles.btnSecondary}>Sign In</Link>
                <Link href="/auth" className={styles.btnPrimary}>Start Free</Link>
              </div>
            )}

            <button className={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
                    <h3 className="font-black text-white">{profile?.full_name || 'Student'}</h3>
                    <p className="text-xs text-indigo-400">@{profile?.username || 'learner'}</p>
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
                  <Link href={`/u/${profile?.username}`} className="block w-full text-center py-4 bg-white/5 rounded-2xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>
                    My Profile
                  </Link>
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
      </header>

      {/* Global Search Modal */}
      <AnimatePresence>
        {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
