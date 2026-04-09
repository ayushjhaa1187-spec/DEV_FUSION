'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';
import './sessions.css';

export default function LiveSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        // Fetch sessions from mentors the user follows
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

    const [joinedSessions, setJoinedSessions] = useState<Record<string, boolean>>({});

    if (loading) return <div className="sb-page sessions-container"><div className="sb-loading">Finding live sessions...</div></div>;

    return (
      <div className="sb-page sessions-container">
        <header className="sessions-header sb-stagger-1">
          <h1 className="sb-title">Live <span>Doubt Sessions</span></h1>
          <p className="sb-subtitle">Join live interactive sessions from the mentors you follow and get instant clarification.</p>
        </header>
  
        <div className="sessions-grid sb-stagger-2">
          {sessions.length > 0 ? sessions.map((session, i) => (
            <div key={i} className="session-card glass">
              <div className="session-top">
                <span className={`status-tag ${session.is_live ? 'live' : 'upcoming'}`}>
                  {session.is_live ? '● Live Now' : 'Upcoming'}
                </span>
                <span className="session-time">{new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h3>{session.mentor_profiles?.specialty || 'Academic Session'}</h3>
              <div className="mentor-mini">
                <div className="mini-avatar" />
                <span>{session.profiles?.username}</span>
              </div>
              
              {session.is_live ? (
                <>
                  {joinedSessions[session.id] ? (
                    <div className="jitsi-wrapper" style={{ marginTop: '20px' }}>
                      <iframe
                        src={`${session.meeting_link}#config.startWithVideoMuted=true`}
                        allow="camera; microphone; display-capture"
                        style={{ width: '100%', height: '400px', border: 'none', borderRadius: '16px' }}
                      />
                      <button 
                        onClick={() => setJoinedSessions({...joinedSessions, [session.id]: false})}
                        className="sb-btnGhost" 
                        style={{ width: '100%', marginTop: '10px' }}
                      >
                        Minimize Session
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setJoinedSessions({...joinedSessions, [session.id]: true})}
                      className="sb-btnPrimary" 
                      style={{ width: '100%', marginTop: '20px', border: 'none' }}
                    >
                      Join Live Session
                    </button>
                  )}
                </>
              ) : (
                <button className="sb-btnGhost" disabled style={{ width: '100%', marginTop: '20px' }}>
                  Opens at {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </button>
              )}
            </div>
          )) : (
          <div className="empty-sessions glass">
            <p>You're not following any mentors with upcoming sessions.</p>
            <Link href="/mentors" className="sb-btnGhost" style={{ marginTop: '16px' }}>Explore Mentors</Link>
          </div>
        )}
      </div>
    </div>
  );
}
