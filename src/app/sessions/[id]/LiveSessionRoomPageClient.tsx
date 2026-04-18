'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Users, Shield, ClipboardCheck } from 'lucide-react';
import { LoadingPage } from '@/components/ui/Loading';

export default function LiveSessionRoomPageClient({ id }: { id: string }) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function loadBooking() {
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:student_id(username, full_name, avatar_url),
          mentor_profiles:mentor_id(profiles:user_id(username, full_name, avatar_url))
        `)
        .eq('id', id)
        .single();
      
      setBooking(data);
      setLoading(false);
    }
    loadBooking();
  }, [id, supabase]);

  useEffect(() => {
    if (!booking) return;

    const domain = 'meet.jit.si';
    const interval = setInterval(() => {
        if ((window as any).JitsiMeetExternalAPI) {
            clearInterval(interval);
            const options = {
              roomName: booking.jitsi_room_name || `SkillBridge-Session-${id}`,
              width: '100%',
              height: '100%',
              parentNode: document.querySelector('#jitsi-container'),
              userInfo: {
                displayName: user?.email?.split('@')[0] || 'Member',
                email: user?.email
              },
              configOverwrite: {
                startWithAudioMuted: true,
                disableInviteFunctions: true
              },
              interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                  'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                  'fimsences', 'hangup', 'profile', 'chat', 'recording',
                  'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                  'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                  'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                  'security'
                ],
              }
            };

            const api = new (window as any).JitsiMeetExternalAPI(domain, options);
            
            api.addEventListener('participantJoined', (participant: any) => {
              setParticipants(prev => [...prev, participant]);
            });

            return () => api.dispose();
        }
    }, 500);

    return () => clearInterval(interval);
  }, [booking, id, user]);

  if (loading) return <LoadingPage text="Initializing Secure Stream..." />;
  if (!booking) return <div className="h-screen bg-black flex items-center justify-center text-white">Session not found.</div>;

  const isMentor = user?.id === booking.mentor_id;

  return (
    <main className="h-screen flex flex-col bg-black overflow-hidden pt-[72px]">
      
      <div className="flex-1 flex">
        <aside className="w-80 bg-[#0f0f1a] border-r border-gray-800 p-8 hidden lg:flex flex-col">
          <div className="mb-12">
             <div className="flex items-center gap-2 text-indigo-500 mb-2">
               <Shield className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Encrypted Session</span>
             </div>
             <h1 className="text-xl font-black text-white mb-2">Live Mentorship</h1>
             <p className="text-xs text-gray-500 leading-relaxed font-medium">You are in a private conceptual session with @{isMentor ? booking.profiles?.username : booking.mentors?.profiles?.username}.</p>
          </div>

          <div className="flex-1">
             <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-6 flex items-center gap-2">
                <Users className="w-4 h-4" /> Attendance Logic
             </h3>
             <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <img src={booking.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${booking.profiles?.username}`} className="w-10 h-10 rounded-full border border-gray-800" alt="" />
                  <div>
                    <p className="text-sm font-bold text-white leading-none mb-1">{booking.profiles?.full_name || booking.profiles?.username}</p>
                    <span className="text-[10px] text-emerald-500 font-black uppercase">Active Student</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-black">M</div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none mb-1">Mentor</p>
                    <span className="text-[10px] text-gray-500 font-black uppercase">Host</span>
                  </div>
                </div>
             </div>
          </div>

          {isMentor && (
            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/10">
              <ClipboardCheck className="w-5 h-5" />
              Mark Attendance
            </button>
          )}
        </aside>

        <div id="jitsi-container" className="flex-1 bg-black" />
      </div>

      <script src="https://meet.jit.si/external_api.js" async />
    </main>
  );
}
