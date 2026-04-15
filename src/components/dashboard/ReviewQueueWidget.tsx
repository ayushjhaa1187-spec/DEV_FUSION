'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrainCircuit, Rocket, Calendar, CheckCircle2 } from 'lucide-react';

interface ReviewQueueItem {
  id: string;
  concept_id: string;
  subject: string;
  due_at: string;
  last_score: number;
}

export const ReviewQueueWidget = () => {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/review-queue?view=pending&limit=3')
      .then(res => res.json())
      .then(data => setItems(data.items || []))
      .catch(err => console.error('Review queue fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#13132b] p-6 rounded-[32px] border border-white/5 shadow-2xl animate-pulse h-64" />
    );
  }

  return (
    <div className="bg-[#13132b] p-8 rounded-[32px] border border-white/5 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
          <BrainCircuit size={14} className="text-cyan-400" />
          Review Queue
        </div>
        <div className="px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 text-[9px] font-black uppercase tracking-widest">
          SM-2 Powered
        </div>
      </div>

      <div className="flex-1">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Clear Mind</h4>
              <p className="text-[10px] text-gray-500 max-w-[140px] mx-auto leading-relaxed">
                You've mastered all concepts due for review. Take a new test to expand your queue.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="group p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-cyan-400/30 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">
                      <Calendar size={10} />
                      Due {new Date(item.due_at).toLocaleDateString()}
                    </div>
                    <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                      {item.concept_id.split('/').pop()?.replace(/-/g, ' ')}
                    </h4>
                    <div className="text-[9px] text-gray-500 font-bold mt-1">
                      {item.subject} • Last Score: {Math.round(item.last_score * 100)}%
                    </div>
                  </div>
                  <Link 
                    href={`/tests?concept=${item.concept_id}`}
                    className="p-2 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-400/50 text-cyan-400 transition-all"
                  >
                    <Rocket size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <Link 
          href="/tests?view=review" 
          className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 hover:text-white transition-colors pt-4 border-t border-white/5"
        >
          View Full Spaced Repetition Queue
        </Link>
      )}
    </div>
  );
};
