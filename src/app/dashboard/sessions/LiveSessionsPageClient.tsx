'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';
import './sessions.css';

export default function LiveSessionsPageClient() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedSessions, setJoinedSessions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/mentors/followed-sessions');
        const data = await res.json();
        setSessions(data || []);
      } catch (err) {
        console.error('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchSessions();
  }, [user]);

  if (loading) return (
    <div className="sb-page sessions-container animate-pulse">
      <div className="h-10 bg-white/5 rounded-xl w-64 mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white/5 rounded-3xl" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="sb-page sessions-container">
      <header className="sessions-header sb-stagger-1">
        <h1 className="sb-title">Live <span>Doubt Sessions</span></h1>
        <p className="sb-subtitle">Join live interactive sessions from the mentors you follow and get instant clarification.</p>
      </header>

      <div className="sessions-grid sb-stagger-2">
        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sessions.map((session, i) => (
              <div key={i} className="session-card glass p-8 rounded-[40px] border border-white/5 hover:border-indigo-500/20 transition-all flex flex-col h-full">
                <div className="session-top flex justify-between items-center mb-6">
                  <span className={`status-tag px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${session.is_live ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-gray-500/10 text-gray-500'}`}>
                    {session.is_live ? '● Live Now' : 'Upcoming'}
                  </span>
                  <span className="session-time text-xs font-bold text-gray-500">{new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h3 className="text-xl font-black mb-4 tracking-tighter">{session.mentor_profiles?.specialty || 'Academic Session'}</h3>
                <div className="mentor-mini flex items-center gap-3 mb-auto">
                  <div className="mini-avatar w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                  <span className="text-sm font-bold text-gray-400">@{session.profiles?.username}</span>
                </div>
                
                {session.is_live ? (
                  <div className="mt-8 pt-8 border-t border-white/5">
                    {joinedSessions[session.id] ? (
                      <div className="jitsi-wrapper space-y-4">
                        <iframe
                          src={`${session.meeting_link}#config.startWithVideoMuted=true`}
                          allow="camera; microphone; display-capture"
                          className="w-full aspect-video border-none rounded-2xl shadow-2xl"
                        />
                        <button 
                          onClick={() => setJoinedSessions({...joinedSessions, [session.id]: false})}
                          className="w-full py-3 bg-white/5 text-gray-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:text-white transition"
                        >
                          Minimize Session
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setJoinedSessions({...joinedSessions, [session.id]: true})}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                      >
                        Join Live Session
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <button className="w-full py-4 bg-white/5 text-gray-600 rounded-xl font-black uppercase tracking-widest text-[10px] cursor-not-allowed" disabled>
                      Opens at {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-sessions glass p-20 text-center rounded-[40px] border border-white/5">
            <p className="text-gray-500 font-medium">You're not following any mentors with upcoming sessions.</p>
            <Link href="/mentors" className="sb-btnGhost mt-8 inline-block">Explore Mentors</Link>
          </div>
        )}
      </div>
    </div>
  );
}
