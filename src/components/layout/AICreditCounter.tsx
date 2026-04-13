'use client';

import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AICreditCounter() {
  const [credits, setCredits] = useState<number | null>(null);
  const [tier, setTier] = useState<string>('free');

  useEffect(() => {
    const fetchCredits = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('current_ai_credits, current_tier')
        .eq('id', user.id)
        .single();

      if (data) {
        setCredits(data.current_ai_credits || 0);
        setTier(data.current_tier || 'free');
      }

      // Subscribe to profile changes for live update
      const channel = supabase
        .channel('credit-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            setCredits(payload.new.current_ai_credits);
            setTier(payload.new.current_tier);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    fetchCredits();
  }, []);

  if (credits === null) return null;

  const maxCredits = tier === 'elite' ? 200 : tier === 'pro' ? 50 : 10;
  const percentage = Math.min((credits / maxCredits) * 100, 100);

  return (
    <Link href="/pricing" className="group flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#13132B] border border-white/10 hover:border-indigo-500/50 transition-colors">
      <div className={`p-1.5 rounded-full ${credits > 0 ? 'bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30' : 'bg-red-500/20 text-red-500'}`}>
        <Zap className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-[70px]">
        <div className="flex justify-between items-end gap-2 mb-1">
          <span className="text-xs font-bold text-white">{credits} <span className="text-gray-500 font-normal">left</span></span>
          {tier !== 'elite' && <span className="text-[9px] text-indigo-400 font-bold uppercase">Upgrade</span>}
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${credits === 0 ? 'bg-red-500' : 'bg-indigo-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
