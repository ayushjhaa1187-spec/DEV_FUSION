'use client';

import { useEffect } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export function useSafeRealtime(
  table: string,
  filter: string,
  onInsert: (payload: any) => void
) {
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    if (!table || !filter) return;

    console.log(`[Realtime] Subscribing to ${table} with filter: ${filter}`);
    const channelName = `realtime:${table}:${filter.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table,
          filter: filter,
        },
        (payload) => {
          onInsert(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Successfully subscribed to ${channelName}`);
        }
      });

    return () => {
      console.log(`[Realtime] Cleaning up subscription for ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [table, filter, onInsert, supabase]);
}
