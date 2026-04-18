"use client";

import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { notificationApi } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await notificationApi.getNotifications();
        if (res.success && Array.isArray(res.data)) {
          setNotifications(res.data);
          setUnreadCount(res.data.filter((n: any) => !n.is_read).length);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };

    fetchNotifications();

    // Supabase Realtime Bindings
    const channel = supabase
      .channel('custom-notification-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markRead(''); // Pass empty to mark all
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
        case 'DOUBT_ANSWERED': return <MessageSquare size={16} className="text-indigo-400" />;
        case 'SESSION_REMINDER': default: return <Calendar size={16} className="text-emerald-400" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative isolate z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all focus:outline-none"
      >
        <Bell size={20} className="text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-40" 
               onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 sm:w-96 bg-[#0c0c16]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-black text-white text-sm uppercase tracking-widest">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-indigo-400 hover:text-indigo-300 uppercase font-black cursor-pointer">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-bold text-xs uppercase tracking-widest">
                    No new alerts
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                        key={n.id} 
                        className={`p-4 border-b border-white/5 transition-all text-left flex gap-4 ${!n.is_read ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
                        onClick={() => {
                            if (!n.is_read) handleMarkAsRead(n.id);
                        }}
                    >
                      <div className="mt-1 flex-shrink-0">
                          {getIcon(n.type)}
                      </div>
                      <div className="flex-1 cursor-pointer">
                        <p className={`text-sm tracking-tight ${!n.is_read ? 'text-white font-bold' : 'text-gray-400 font-medium'}`}>
                            {n.message}
                        </p>
                        <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {!n.is_read && (
                          <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }} className="flex-shrink-0 text-indigo-400 p-1">
                              <Check size={14} />
                          </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
