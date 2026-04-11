'use client';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Dropdown } from '@/components/ui/Dropdown';
import { cn } from './Button';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createSupabaseBrowser();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }

      // Listen for new notifications
      const channel = supabase
        .channel('bell_notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
             setNotifications(prev => [payload.new, ...prev].slice(0, 10));
             setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();
      
      return () => { supabase.removeChannel(channel); }
    };
    init();
  }, [supabase]);

  const markAsRead = async (id: string) => {
     await supabase.from('notifications').update({ is_read: true }).eq('id', id);
     setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
     setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
     if (!userId) return;
     await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
     setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
     setUnreadCount(0);
  };

  const trigger = (
    <button className="relative p-2 rounded-full hover:bg-bg-tertiary transition-colors">
      <Bell className="w-6 h-6 text-text-primary" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center bg-error text-white text-[10px] font-bold rounded-full border-2 border-bg-primary">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );

  const items = notifications.length === 0 
    ? [{ id: 'empty', label: 'No new notifications', disabled: true }]
    : [
        { id: 'mark-all', label: 'Mark all as read', onClick: markAllRead, icon: <span className="text-primary text-xs font-bold uppercase">Clear</span> },
        ...notifications.map(n => ({
          id: n.id,
          label: n.title,
          icon: <div className={cn("w-2 h-2 rounded-full mt-1", n.is_read ? 'bg-transparent' : 'bg-primary')} />,
          onClick: () => markAsRead(n.id)
        }))
      ];

  return <Dropdown trigger={trigger} items={items} align="right" className="w-80" />;
};
