'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/components/ui/Toast';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export function GamificationListener() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [supabase] = useState(() => createSupabaseBrowser());

  useEffect(() => {
    if (!user) return;

    // Listen for new reputation events
    const reputationChannel = supabase
      .channel('reputation_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reputation_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const { points_delta, event_type } = payload.new;
          if (points_delta > 0) {
             showToast(`+${points_delta} XP earned for ${event_type}!`, 'success');
          }
        }
      )
      .subscribe();

    // Listen for new badges
    const badgesChannel = supabase
      .channel('badge_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const { badge_id } = payload.new;
          // Fetch badge details
          const { data } = await supabase.from('badges').select('name').eq('id', badge_id).single();
          if (data) {
             showToast(`🏆 Badge Unlocked: ${data.name}!`, 'success');
          }
        }
      )
      .subscribe();

    // Listen for new notifications
    const notificationChannel = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const { title, body } = payload.new;
          showToast(`${title}: ${body}`, 'info');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reputationChannel);
      supabase.removeChannel(badgesChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, [user, showToast]);

  return null; // pure logical component
}
