'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Video, Star, FileText, Calendar, User, Loader2 } from 'lucide-react';

interface SessionDetailData {
  booking: {
    id: string;
    status: string;
    jitsi_room_name?: string;
    session_notes?: string;
    rating?: number;
    feedback?: string;
    mentor_profiles?: {
      profiles?: {
        full_name?: string;
        username?: string;
      };
    };
    student_profile?: {
      full_name?: string;
      username?: string;
    };
    mentor_slots?: {
      start_time?: string;
      end_time?: string;
    };
  };
  jitsiUrl: string;
}

async function fetchSessionDetail(bookingId: string): Promise<SessionDetailData> {
  const res = await fetch(`/api/mentor-bookings/${bookingId}/confirm`);
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
}

async function updateSession(payload: {
  bookingId: string;
  session_notes?: string;
  rating?: number;
  feedback?: string;
}) {
  const res = await fetch('/api/sessions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update session');
  return res.json();
}

export default function SessionDetailClient({
  bookingId,
  userId,
}: {
  bookingId: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [sessionActive, setSessionActive] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['session', bookingId],
    queryFn: () => fetchSessionDetail(bookingId),
  });

  useEffect(() => {
    const startTime = data?.booking?.mentor_slots?.start_time;
    if (data?.booking?.status === 'confirmed' && startTime) {
      const start = new Date(startTime).getTime();
      const checkActive = () => {
        const now = Date.now();
        setSessionActive(start - now <= 10 * 60 * 1000);
      };
      checkActive();
      const interval = setInterval(checkActive, 60000);
      return () => clearInterval(interval);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: updateSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', bookingId] });
      alert('Session updated successfully!');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        Session not found.
      </div>
    );
  }

  const { booking, jitsiUrl } = data;
  const isMentor = booking.mentor_profiles !== undefined;
  const counterpartName = isMentor
    ? booking.student_profile?.full_name || booking.student_profile?.username || 'Student'
    : booking.mentor_profiles?.profiles?.full_name ||
      booking.mentor_profiles?.profiles?.username ||
      'Mentor';

  const startTime = booking.mentor_slots?.start_time;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Session Details</h1>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <User className="w-4 h-4" />
            <span>{counterpartName}</span>
            {startTime && (
              <>
                <Calendar className="w-4 h-4 ml-2" />
                <span>{new Date(startTime).toLocaleString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Jitsi Join Button */}
        {sessionActive && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-500/30 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Join Live Session</h2>
            <a
              href={jitsiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Video className="w-5 h-5" />
              Join via Jitsi Meet
            </a>
          </div>
        )}

        {/* Session Notes */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Session Notes
          </h2>
          <textarea
            value={notes || booking.session_notes || ''}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes during or after the session..."
            rows={5}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() =>
              updateMutation.mutate({ bookingId, session_notes: notes })
            }
            disabled={updateMutation.isPending}
            className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Notes'}
          </button>
        </div>

        {/* Rating & Feedback */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Rate This Session
          </h2>

          {/* Star Rating */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => setRating(val)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    (rating || booking.rating || 0) >= val
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={feedback || booking.feedback || ''}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your feedback about this session..."
            rows={4}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-3"
          />

          <button
            onClick={() =>
              updateMutation.mutate({
                bookingId,
                rating: rating || booking.rating,
                feedback: feedback || booking.feedback,
              })
            }
            disabled={updateMutation.isPending || (!rating && !feedback)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
