'use client';

import { useEffect, useState } from 'react';
import { useSafeRealtime } from '@/hooks/useSafeRealtime';
import { useToast } from '@/components/ui/Toast';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Bell, Award, MessageSquare, Zap } from 'lucide-react';

export function NotificationToastProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [supabase]);

  useSafeRealtime(
    'notifications',
    userId ? `user_id=eq.${userId}` : '',
    (notification) => {
      // Get appropriate icon based on type
      let Icon = Bell;
      let colorClass = 'text-primary';

      if (notification.type === 'badge_unlock') {
        Icon = Award;
        colorClass = 'text-yellow-500';
      } else if (notification.type.includes('answer')) {
        Icon = MessageSquare;
        colorClass = 'text-blue-500';
      } else if (notification.type.includes('rep')) {
        Icon = Zap;
        colorClass = 'text-orange-500';
      }

      showToast(
        <div className="flex items-start gap-3">
          <div className={`p-2 bg-bg-primary rounded-lg ${colorClass}`}>
            <Icon size={18} />
          </div>
          <div>
            <p className="font-bold text-sm text-white">{notification.title || 'New Notification'}</p>
            <p className="text-xs text-text-secondary">{notification.message}</p>
          </div>
        </div>,
        'info'
      );

      // Play subtle notification sound if needed (optional)
      // new Audio('/sounds/notification.mp3').play().catch(() => {});
    }
  );

  return <>{children}</>;
}
