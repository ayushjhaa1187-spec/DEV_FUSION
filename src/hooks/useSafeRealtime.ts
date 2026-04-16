'use client';

import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createSupabaseBrowser } from '@/lib/supabase/client';

/**
 * Global Realtime Registry
 * Tracks active channels across all hook instances to prevent duplicate subscriptions
 * and the feared "callbacks after subscribe" error.
 */
const globalChannelRegistry = new Map<string, RealtimeChannel>();

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
  const handlersRef = useRef(callbacks);
  const isValid = Array.isArray(callbacks);

  // Sync handlers ref on every render without re-subscribing
  if (isValid) {
    handlersRef.current = callbacks;
  }

  useEffect(() => {
    if (!isValid || !channelSuffix || !supabase) return;

    const channelName = `safe-${channelSuffix}`;
    
    // 1. Force Purge any existing registry entry for this suffix
    const existing = globalChannelRegistry.get(channelName);
    if (existing) {
      console.log(`[Realtime] Force-purging stale registry entry: ${channelName}`);
      supabase.removeChannel(existing);
      globalChannelRegistry.delete(channelName);
    }

    // 2. Initialize channel
    const channel = supabase.channel(channelName);
    
    // 3. Attach handlers via Proxy to the latest ref
    callbacks.forEach((cb) => {
      channel.on(
        'postgres_changes' as any,
        { 
          event: cb.event, 
          schema: cb.schema || 'public', 
          table: cb.table,
          filter: cb.filter 
        },
        (payload) => {
          const latest = handlersRef.current.find(c => 
            c.table === cb.table && 
            c.event === cb.event && 
            c.filter === cb.filter
          );
          if (latest) latest.handler(payload);
        }
      );
    });

    // 4. Register and Subscribe
    globalChannelRegistry.set(channelName, channel);
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Global Registry Active: ${channelName}`);
      }
    });

    // 5. Cleanup
    return () => {
      const active = globalChannelRegistry.get(channelName);
      if (active) {
        console.log(`[Realtime] Purging Registry: ${channelName}`);
        supabase.removeChannel(active);
        globalChannelRegistry.delete(channelName);
      }
    };
  }, [channelSuffix, supabase, isValid]); 

  return { supabase };
}
