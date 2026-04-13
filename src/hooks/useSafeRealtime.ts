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
    const channelName = `realtime:${table}:${filter}`;
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, onInsert, supabase]);
}
