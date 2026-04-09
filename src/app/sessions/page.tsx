'use client';

import { useQuery } from '@tanstack/react-query';
import { Video, Star, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

type Session = {
  id: string;
  mentor_name: string;
  mentor_avatar?: string;
  subject: string;
  session_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  jitsi_room_id: string;
  rating?: number;
};

async function fetchSessions(): Promise<{ upcoming: Session[]; past: Session[] }> {
  const res = await fetch('/api/sessions');
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export default function SessionsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['sessions'], queryFn: fetchSessions });
  const [activeJitsiRoom, setActiveJitsiRoom] = useState<string | null>(null);

  const upcoming = data?.upcoming ?? [];
  const past = data?.past ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Sessions</h1>

        {/* Jitsi iframe if active */}
        {activeJitsiRoom && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Session</h2>
              <button onClick={() => setActiveJitsiRoom(null)} className="text-red-500 hover:text-red-600 text-sm font-medium">Leave Session</button>
            </div>
            <iframe
              src={`https://meet.jit.si/${activeJitsiRoom}`}
              allow="camera; microphone; fullscreen; display-capture"
              className="w-full h-96 rounded-xl border border-gray-200 dark:border-gray-700"
            />
          </div>
        )}

        {/* Upcoming Sessions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming Sessions</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No upcoming sessions</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {upcoming.map((session) => (
                <SessionCard key={session.id} session={session} isUpcoming onJoinClick={() => setActiveJitsiRoom(session.jitsi_room_id)} />
              ))}
            </div>
          )}
        </div>

        {/* Past Sessions */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Past Sessions</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
            </div>
          ) : past.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No past sessions</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {past.map((session) => <SessionCard key={session.id} session={session} isUpcoming={false} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session, isUpcoming, onJoinClick }: { session: Session; isUpcoming: boolean; onJoinClick?: () => void }) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(0);

  const handleRateSubmit = async () => {
    await fetch(`/api/sessions/${session.id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
    setShowRatingForm(false);
  };

  const statusChip = {
    pending: <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full">Pending</span>,
    confirmed: <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 text-xs rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Confirmed</span>,
    completed: <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">Completed</span>,
    cancelled: <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 text-xs rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>,
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
          {session.mentor_avatar ? (
            <img src={session.mentor_avatar} alt={session.mentor_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center text-white font-bold">
              {session.mentor_name[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{session.mentor_name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{session.subject}</p>
            </div>
            {statusChip[session.status]}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(session.session_time).toLocaleString()}</span>
            <span>{session.duration_minutes} min</span>
          </div>

          {/* Join button for upcoming */}
          {isUpcoming && session.status === 'confirmed' && onJoinClick && (
            <button onClick={onJoinClick} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              <Video className="w-4 h-4" /> Join Session
            </button>
          )}

          {/* Rating for past unrated sessions */}
          {!isUpcoming && session.status === 'completed' && !session.rating && (
            <div>
              {!showRatingForm ? (
                <button onClick={() => setShowRatingForm(true)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Rate this session</button>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button key={val} onClick={() => setRating(val)} className={`transition ${rating >= val ? 'text-yellow-500' : 'text-gray-300'}`}>
                        <Star className="w-5 h-5" fill={rating >= val ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <button onClick={handleRateSubmit} disabled={rating === 0} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50">Submit</button>
                  <button onClick={() => setShowRatingForm(false)} className="text-gray-500 text-sm">Cancel</button>
                </div>
              )}
            </div>
          )}

          {/* Show rating if already rated */}
          {session.rating && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Your rating:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((val) => (
                  <Star key={val} className="w-4 h-4 text-yellow-500" fill={val <= session.rating! ? 'currentColor' : 'none'} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
