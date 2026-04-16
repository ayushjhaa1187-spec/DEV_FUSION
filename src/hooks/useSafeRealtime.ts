'use client';

import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createSupabaseBrowser } from '@/lib/supabase/client';

/**
 * useSafeRealtime
 * A hook to manage Supabase Realtime channels with strict safety patterns:
 * 1. Unique channel naming to avoid "callbacks after subscribe" collisions.
 * 2. Proper cleanup on unmount.
 * 3. Stable Supabase client.
 */
export function useSafeRealtime(
  channelSuffix: string,
  callbacks: {
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    schema?: string;
    table: string;
    filter?: string;
    handler: (payload: any) => void;
  }[]
) {
  const [supabase] = useState(() => createSupabaseBrowser());
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // 1. Create unique channel name
    const uniqueId = Math.random().toString(36).substring(7);
    const channelName = `safe-stream-${channelSuffix}-${uniqueId}`;
    
    // 2. Initialize channel
    const channel = supabase.channel(channelName);
    
    // 3. Attach callbacks BEFORE subscribing
    callbacks.forEach((cb) => {
      channel.on(
        'postgres_changes',
        {
          event: cb.event,
          schema: cb.schema || 'public',
          table: cb.table,
          filter: cb.filter,
        },
        cb.handler
      );
    });

    // 4. Subscribe
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to ${channelName}`);
      }
      if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Failed to subscribe to ${channelName}`);
      }
    });

    channelRef.current = channel;

    // 5. Cleanup
    return () => {
      if (channelRef.current) {
        console.log(`[Realtime] Unsubscribing from ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelSuffix, supabase]); // Callbacks are usually not stable, so we handle with care in implementation

  return { supabase };
}
