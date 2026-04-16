'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Video,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronRight,
  Star,
} from 'lucide-react';
import { getJitsiMeetUrl, generateJitsiRoomName } from '@/lib/jitsi';

type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface SessionData {
  id: string;
  student_id: string;
  mentor_id: string;
  status: SessionStatus;
  jitsi_room_name?: string;
  jitsi_url?: string;
  start_time?: string;
  end_time?: string;
  rating?: number;
  amount_paid?: number;
  mentor_profiles?: {
    subjects?: string[];
    profiles?: {
      full_name?: string;
      avatar_url?: string;
      username?: string;
    };
  };
  student_profile?: {
    full_name?: string;
    avatar_url?: string;
    username?: string;
  };
}

async function fetchSessions(): Promise<{ upcoming: SessionData[]; past: SessionData[] }> {
  const res = await fetch('/api/sessions');
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

function isJoinable(startTime?: string, endTime?: string): boolean {
  if (!startTime) return false;
  const now = Date.now();
  const start = new Date(startTime).getTime();
  // Final Stabilization: Enforce 30-minute duration instead of 60m
  const end = endTime ? new Date(endTime).getTime() : start + 30 * 60 * 1000;
  // Active 10 minutes before start and during session
  return now >= start - 10 * 60 * 1000 && now <= end;
}

function formatDateTime(dt?: string): string {
  if (!dt) return 'TBD';
  return new Date(dt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    confirmed: { label: 'Confirmed', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
    completed: { label: 'Completed', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function SessionCard({ session, userId }: { session: SessionData; userId: string }) {
  const isMentor = session.mentor_profiles !== undefined;
  const mentorProfile = session.mentor_profiles?.profiles;
  const studentProfile = session.student_profile;

  const counterpartName =
    session.student_id === userId
      ? mentorProfile?.full_name || mentorProfile?.username || 'Mentor'
      : studentProfile?.full_name || studentProfile?.username || 'Student';

  const counterpartAvatar =
    session.student_id === userId
      ? mentorProfile?.avatar_url
      : studentProfile?.avatar_url;

  const subjects = session.mentor_profiles?.subjects ?? [];
  const roomName = session.jitsi_room_name || generateJitsiRoomName(session.id);
  const jitsiUrl = session.jitsi_url || getJitsiMeetUrl(roomName);
  const joinable = isJoinable(session.start_time, session.end_time);

  return (
    <div className="group relative bg-white/5 hover:bg-white/8 border border-white/10 hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          {counterpartAvatar ? (
            <Image
              src={counterpartAvatar}
              alt={counterpartName}
              width={48}
              height={48}
              className="rounded-full object-cover ring-2 ring-indigo-500/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {counterpartName[0]?.toUpperCase()}
            </div>
          )}
          {joinable && (
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-gray-900 rounded-full animate-pulse" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold truncate">{counterpartName}</h3>
            <StatusBadge status={session.status} />
          </div>

          {subjects.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {subjects.slice(0, 3).map((s) => (
                <span key={s} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateTime(session.start_time)}
            </span>
            {session.rating && (
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                {session.rating}/5
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {joinable && session.status === 'confirmed' ? (
            <a
              href={jitsiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Video className="w-4 h-4" />
              Join Now
            </a>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 bg-white/10 text-gray-500 text-sm font-medium px-3 py-1.5 rounded-lg cursor-not-allowed"
              title={session.status !== 'confirmed' ? 'Session not confirmed yet' : 'Session not active yet'}
            >
              <Video className="w-4 h-4" />
              Join Session
            </button>
          )}
          <Link
            href={`/sessions/${session.id}`}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-400 transition-colors"
          >
            View Details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SessionsClient({ userId }: { userId: string }) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    staleTime: 30_000,
  });

  const sessions = tab === 'upcoming' ? (data?.upcoming ?? []) : (data?.past ?? []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-300 text-lg">Failed to load sessions.</p>
        <button
          onClick={() => refetch()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            My Sessions
          </h1>
          <p className="text-gray-400 mt-1">Manage your upcoming and past mentorship sessions</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                tab === t
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'upcoming' ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4" /> Upcoming
                  {(data?.upcoming?.length ?? 0) > 0 && (
                    <span className="ml-1 bg-indigo-500/30 text-indigo-300 text-xs px-1.5 py-0.5 rounded-full">
                      {data!.upcoming.length}
                    </span>
                  )}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Past
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Session List */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <Video className="w-14 h-14 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">
              {tab === 'upcoming'
                ? 'No upcoming sessions. Book a mentor to get started!'
                : 'No past sessions yet.'}
            </p>
            {tab === 'upcoming' && (
              <Link
                href="/mentors"
                className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Browse Mentors
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
