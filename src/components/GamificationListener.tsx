'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/components/ui/Toast';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useSafeRealtime } from '@/hooks/useSafeRealtime';

export function GamificationListener() {
  const { user } = useAuth();
  const { showToast } = useToast();

  if (!user) return null;

  const { supabase } = useSafeRealtime(`gamification-${user?.id}`, [
    {
      event: 'INSERT',
      table: 'reputation_events',
      filter: `user_id=eq.${user.id}`,
      handler: (payload) => {
        const { points_delta, event_type } = payload.new;
        if (points_delta > 0) {
          showToast(`+${points_delta} XP earned for ${event_type}!`, 'success');
        }
      }
    },
    {
      event: 'INSERT',
      table: 'user_badges',
      filter: `user_id=eq.${user.id}`,
      handler: async (payload) => {
        const { badge_id } = payload.new;
        const { data } = await supabase.from('badges').select('name').eq('id', badge_id).single();
        if (data) {
          showToast(`🏆 Badge Unlocked: ${data.name}!`, 'success');
        }
      }
    },
    {
      event: 'INSERT',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`,
      handler: (payload) => {
        const { title, body } = payload.new;
        showToast(`${title}: ${body}`, 'info');
      }
    }
  ]);

  return null; // pure logical component
}
