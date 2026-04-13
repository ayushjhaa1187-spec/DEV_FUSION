'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Video, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function SessionsWidget() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then(res => res.json())
      .then(data => {
        setSessions(data.upcoming || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 bg-white/5 rounded-3xl animate-pulse border border-white/5" />;
  if (sessions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <Video size={120} className="text-indigo-400" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Calendar size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Upcoming Sessions</h3>
        </div>

        <div className="space-y-4">
          {sessions.slice(0, 2).map((session) => {
            const startTime = new Date(session.start_time);
            const isSoon = (startTime.getTime() - new Date().getTime()) < (15 * 60 * 1000); // 15 mins

            return (
              <div key={session.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-black/20 backdrop-blur-sm border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 capitalize text-lg font-bold text-white">
                    {(session.mentor_profiles?.profiles?.full_name || session.student_profile?.full_name || 'U')[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">
                      {session.mentor_profiles?.profiles?.full_name || session.student_profile?.full_name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1 font-mono">
                         <Clock size={12} className="text-indigo-400" />
                         {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>•</span>
                      <span>{startTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link href={`/sessions/${session.id}`} className="w-full md:w-auto">
                    <Button 
                      variant={isSoon ? "primary" : "outline"} 
                      size="sm" 
                      className={`w-full md:w-auto gap-2 text-xs font-bold ${isSoon ? 'animate-pulse' : ''}`}
                    >
                      <Video size={14} />
                      {isSoon ? 'Join Now' : 'Enter Room'}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {sessions.length > 2 && (
          <div className="mt-4 flex justify-end">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-2 py-1 rounded">
              +{sessions.length - 2} More Scheduled
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
