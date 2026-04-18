'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSafeRealtime } from '@/hooks/useSafeRealtime';
import { useToast } from '@/components/ui/Toast';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Bell, Award, MessageSquare, Zap, Clock, CheckCircle2, Globe } from 'lucide-react';

export function NotificationToastProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [supabase]);

  const handleNotification = useCallback((payload: any) => {
    const notification = payload.new;
    // Get appropriate icon based on type
    let Icon = Bell;
    let colorClass = 'text-primary';

    if (notification.type === 'badge_unlock') {
      Icon = Award;
      colorClass = 'text-yellow-500';
    } else if (notification.type === 'session_reminder') {
      Icon = Clock;
      colorClass = 'text-indigo-500';
    } else if (notification.type === 'accepted') {
      Icon = CheckCircle2;
      colorClass = 'text-emerald-500';
    } else if (notification.type === 'community_pulse') {
      Icon = Globe;
      colorClass = 'text-cyan-400';
    } else if (notification.type.includes('answer')) {
      Icon = MessageSquare;
      colorClass = 'text-blue-500';
    } else if (notification.type.includes('rep')) {
      Icon = Zap;
      colorClass = 'text-orange-500';
    }

    showToast(
      <div className="flex items-start gap-3 py-1">
        <div className={`p-2.5 bg-white/5 rounded-xl ${colorClass}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm text-white">{notification.title || 'Notification'}</p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notification.body || notification.message}</p>
        </div>
      </div>,
      'info'
    );
  }, [showToast]);

  // Use the NEW safe signature
  useSafeRealtime(
    `toast-${userId || 'anon'}`,
    userId ? [
      {
        event: 'INSERT',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
        handler: handleNotification
      }
    ] : []
  );

  return <>{children}</>;
}
