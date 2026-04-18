'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Mic, MicOff, VideoOff, 
  Settings, LogOut, Clock, Users,
  MessageSquare, Star, Shield, Info,
  AlertCircle, CheckCircle, ChevronRight
} from 'lucide-react';

/**
 * DETERMINISTIC JITSI ROOM GENERATOR
 * Ensures same room for student and mentor based on booking ID
 */
const generateRoomName = (bookingId: string) => {
  return `SkillBridge_Session_${bookingId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;
};

/**
 * SESSION RATING MODAL
 */
function RatingModal({ isOpen, onClose, mentorId, bookingId }: any) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/mentors/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, bookingId, rating, review })
      });
      if (res.ok) setDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-10 rounded-[40px] max-w-lg w-full text-center border border-white/10"
      >
        {done ? (
          <div className="py-8">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Feedback Recorded</h2>
            <p className="text-gray-400 mb-8">Thank you for helping us maintain SkillBridge quality standards.</p>
            <button onClick={onClose} className="sb-btnPrimary w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Close Session Window</button>
          </div>
        ) : (
          <>
            <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">Session Complete</h2>
            <p className="text-gray-400 mb-8">How would you rate your mentorship experience today?</p>
            
            <div className="flex justify-center gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setRating(star)}
                  className={`transition-all ${rating >= star ? 'text-amber-400 scale-125' : 'text-gray-700'}`}
                >
                  <Star size={40} fill={rating >= star ? "currentColor" : "none"} />
                </button>
              ))}
            </div>

            <textarea 
              placeholder="What did you learn? (Optional)"
              className="w-full bg-white/5 border border-white/5 p-6 rounded-3xl mb-8 outline-none focus:border-indigo-500/20 text-white min-h-[120px]"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />

            <div className="flex gap-4">
               <button 
                 onClick={onClose} 
                 className="flex-1 py-4 text-gray-400 font-black uppercase tracking-widest text-[10px]"
               >
                 Skip
               </button>
               <button 
                 onClick={handleSubmit} 
                 disabled={rating === 0 || submitting}
                 className="flex-2 px-10 py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
               >
                 {submitting ? 'Recording...' : 'Submit Feedback'}
               </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function SessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const supabase = createSupabaseBrowser();

  // 1. DATA FETCH & AUTH
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          availability_slots:slot_id(start_time),
          mentor_profiles:mentor_id(id, user_id, profiles:user_id(full_name)),
          profiles:student_id(full_name)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Session not found');
        return;
      }

      setBooking(data);
      setIsStudent(data.student_id === user.id);
      setLoading(false);
    }
    init();
  }, [id, supabase, router]);

  // 2. TIMING BUFFER LOGIC (15 MIN)
  useEffect(() => {
    if (!booking) return;

    const timer = setInterval(() => {
      const startTime = new Date(booking.availability_slots?.start_time || booking.created_at).getTime();
      const now = new Date().getTime();
      const diffInSeconds = Math.floor((startTime - now) / 1000);
      
      // Allow entry if within 15 mins of start or session has already started
      const bufferSeconds = 15 * 60;
      if (diffInSeconds <= bufferSeconds) {
        setIsRoomReady(true);
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft(diffInSeconds - bufferSeconds);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking]);

  // 3. JITSI INIT
  useEffect(() => {
    if (isRoomReady && booking && !apiRef.current && jitsiContainerRef.current) {
      const loadJitsiScript = () => {
        return new Promise((resolve) => {
          if ((window as any).JitsiMeetExternalAPI) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://meet.jit.si/external_api.js';
          script.async = true;
          script.onload = () => resolve(true);
          document.body.appendChild(script);
        });
      };

      loadJitsiScript().then(() => {
        const roomName = generateRoomName(booking.id);
        const options = {
          roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          configOverwrite: {
            startWithAudioMuted: true,
            disableModeratorIndicator: false,
            startScreenSharing: false,
            enableEmailInStats: false,
            prejoinPageEnabled: false,
          },
          interfaceConfigOverwrite: {
             TILE_VIEW_MAX_COLUMNS: 1,
             TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'chat', 'raisehand',
                'videoquality', 'filmstrip', 'tileview', 'stats'
             ],
          },
          userInfo: {
            displayName: isStudent ? booking.profiles?.full_name : booking.mentor_profiles?.profiles?.full_name
          }
        };

        apiRef.current = new (window as any).JitsiMeetExternalAPI('meet.jit.si', options);
        apiRef.current.addEventListeners({
          readyToClose: () => {
            if (isStudent) setIsRatingOpen(true);
            else router.push('/dashboard');
          },
          videoConferenceTerminated: () => {
            if (isStudent) setIsRatingOpen(true);
            else router.push('/dashboard');
          }
        });
      });
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [isRoomReady, booking, isStudent, router]);

  if (loading) return (
    <div className="h-screen bg-[#0d0d1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Syncing Secure Bridge...</span>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#0d0d1a] flex flex-col overflow-hidden text-white font-sans">
      {/* HUD Header */}
      <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#0d0d1a]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl ring-1 ring-red-500/20 animate-pulse">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-white">Live Session Bridge</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
               Bridge ID: {booking.id.slice(0, 8)} • Host: {booking.mentor_profiles?.profiles?.full_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {!isRoomReady && timeLeft !== null && (
              <div className="flex items-center gap-3 px-6 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                 <Clock size={14} className="text-indigo-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                    Bridge Entry in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
              </div>
           )}
           <button 
             onClick={() => router.back()} 
             className="px-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition"
           >
             Terminate Connection
           </button>
        </div>
      </header>

      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {!isRoomReady ? (
            <motion.div 
              key="waiting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-radial-gradient from-indigo-500/10 to-transparent"
            >
               <div className="text-center max-w-lg">
                  <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-10 rotate-3">
                     <Clock className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Bridge Not Open</h2>
                  <p className="text-gray-500 leading-relaxed font-medium mb-10">
                     Security protocols allow entry exactly 15 minutes before the scheduled time. 
                     Please remain on this terminal; the bridge will initiate automatically.
                  </p>
                  <div className="p-6 bg-white/5 border border-white/5 rounded-3xl text-left flex gap-4">
                     <Info className="text-indigo-400 mt-1" size={20} />
                     <p className="text-xs text-gray-400 leading-relaxed">
                        Ensure your camera and microphone are connected. Once the bridge opens, 
                        you will be requested to provide permissions.
                     </p>
                  </div>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="bridge"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-full bg-black flex"
            >
               <div ref={jitsiContainerRef} className="flex-1" />
               
               {/* Side Notes Interface (Hidden for students in this view, could be expanded) */}
               <aside className="w-96 border-l border-white/5 bg-[#0d0d1a] p-8 hidden xl:flex flex-col">
                  <div className="flex items-center gap-3 mb-8">
                     <MessageSquare size={18} className="text-indigo-400" />
                     <h3 className="text-xs font-black uppercase tracking-widest">Shared Session Notes</h3>
                  </div>
                  <div className="flex-1 bg-white/5 border border-white/5 rounded-3xl p-6 text-sm text-gray-500 font-mono italic">
                     Collaboration artifacts and whiteboard sync will appear here in future updates. 
                     Use the Jitsi chat for real-time messages.
                  </div>
               </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <RatingModal 
        isOpen={isRatingOpen} 
        onClose={() => router.push('/dashboard')} 
        mentorId={booking?.mentor_id}
        bookingId={booking?.id}
      />

      <style jsx global>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .sb-btnPrimary {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </div>
  );
}
