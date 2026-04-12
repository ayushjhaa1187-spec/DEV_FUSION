'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Bell, Hash, MessageSquare, Flame, CheckCircle, Info, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './NotificationBell.module.css';

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'mention': return <Hash size={14} className="text-blue-400" />;
    case 'answer_posted': return <MessageSquare size={14} className="text-emerald-400" />;
    case 'rep': return <Flame size={14} className="text-orange-400" />;
    case 'accepted': return <CheckCircle size={14} className="text-green-400" />;
    case 'session_reminder': return <Clock size={14} className="text-indigo-400" />;
    default: return <Info size={14} className="text-gray-400" />;
  }
};


export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    // Initial fetch
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => data && setNotifications(data));

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:user_id=eq.${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev.slice(0, 9)]);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [userId, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleOpen = useCallback(async () => {
    const nextState = !open;
    setOpen(nextState);
    
    if (nextState && unreadCount > 0) {
      try {
        await fetch('/api/notifications/mark-read', { method: 'PATCH' });
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch (err) {
        console.error('Failed to mark notifications as read', err);
      }
    }
  }, [open, unreadCount]);

  return (
    <div className={styles.notifWrapper} ref={dropdownRef}>
      <button 
        onClick={handleOpen} 
        aria-label="Notifications" 
        className={`${styles.iconBtn} ${open ? styles.active : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={styles.notifDropdown}
          >
            <div className={styles.notifHeader}>
              <span className={styles.headerTitle}>Notifications</span>
            </div>
            
            <div className={styles.notifList}>
              {notifications.length === 0 ? (
                <div className={styles.notifEmpty}>
                  <Bell size={32} className="text-gray-800 opacity-20" />
                  <p className={styles.emptyTitle}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <Link 
                    key={n.id} 
                    href={n.link || '/doubts'}
                    onClick={() => setOpen(false)}
                    className={`${styles.notifItem} ${!n.is_read ? styles.notifUnread : ''}`}
                  >
                    <div className={styles.notifIcon}>
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className={styles.notifContent}>
                      <p className={styles.notifMsg}>{n.message}</p>
                      <span className={styles.notifTime}>{formatRelativeTime(n.created_at)}</span>
                    </div>
                    {!n.is_read && <div className={styles.statusDot} />}
                  </Link>
                ))
              )}
            </div>
            
            <Link 
              href="/profile" 
              onClick={() => setOpen(false)}
              className={styles.notifFooter}
            >
              View All Activity
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
