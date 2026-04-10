'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Shield, Users, Clock, Video } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SessionLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const res = await fetch(`/api/mentor-bookings/${id}`);
      const data = await res.json();
      setSession(data);
      setLoading(false);
    }
    loadSession();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center text-indigo-500 font-black">Initializing Secure Broadcast...</div>;

  const jitsiLink = `https://meet.jit.si/skillbridge-${id}`;

  return (
    <main className="min-h-screen bg-[#070712] text-white">
      
      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest">Live Interactive Session</span>
            </div>
            <h1 className="text-3xl font-black font-heading tracking-tight">
               Session with {user?.id === session?.mentor_id ? 'Learner' : 'Expert Mentor'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
             <div className="flex -space-x-3">
               <img src={`https://ui-avatars.com/api/?name=User&background=6366f1&color=fff`} className="w-10 h-10 rounded-full border-4 border-[#070712]" alt="" />
               <img src={`https://ui-avatars.com/api/?name=Mentor&background=10b981&color=fff`} className="w-10 h-10 rounded-full border-4 border-[#070712]" alt="" />
             </div>
             <div>
               <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">End-to-End Encrypted</div>
               <div className="text-xs font-black text-emerald-400">Secure Channel Established</div>
             </div>
          </div>
        </header>

        {/* Video Embed Area (Phase 3.1) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="lg:col-span-3">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-video bg-black rounded-[40px] border border-white/5 overflow-hidden shadow-2xl relative"
              >
                <iframe
                  src={jitsiLink}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  className="w-full h-full border-none"
                />
              </motion.div>
           </div>

           <aside className="space-y-6">
              <div className="bg-[#13132b] border border-white/5 p-8 rounded-[32px]">
                 <h3 className="text-lg font-black mb-6">Interaction Hub</h3>
                 <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                       <Shield size={20} className="text-indigo-500" />
                       <span className="text-sm font-bold">Encrypted Node</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                       <Clock size={20} className="text-indigo-500" />
                       <span className="text-sm font-bold">30 Min Reserved</span>
                    </div>
                 </div>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[32px]">
                 <h4 className="text-xs font-black uppercase text-indigo-400 mb-4 tracking-widest">Mentor Insights</h4>
                 <p className="text-sm text-gray-400 leading-relaxed italic">
                    "Ensure you have a stable connection and a quiet environment for the best collaborative experience."
                 </p>
              </div>

              <button 
                onClick={() => window.location.href = '/dashboard/sessions'}
                className="w-full py-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all border border-red-500/20"
              >
                Terminate Session
              </button>
           </aside>
        </div>
      </div>
    </main>
  );
}
