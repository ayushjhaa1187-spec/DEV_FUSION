'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { Clock, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { getJitsiMeetUrl } from '@/lib/jitsi';

export default function InterviewRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createSupabaseBrowser();
  
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 2 hours in seconds
  const [isHost, setIsHost] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) fetchInterview();
  }, [id, user]);

  useEffect(() => {
    if (timeLeft <= 0) {
      toast.error('Interview time limit reached.');
      router.push('/dashboard');
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router]);

  const fetchInterview = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_interviews')
        .select(`
          *,
          organization_memberships(
            id,
            user_id,
            organization_id,
            organizations(owner_id, name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const membership = data.organization_memberships;
      const isMentor = membership.user_id === user.id;
      const isOrgOwner = membership.organizations.owner_id === user.id;

      if (!isMentor && !isOrgOwner) {
        toast.error('Unauthorized access to this interview room.');
        return router.push('/dashboard');
      }

      setInterview(data);
      setIsHost(isOrgOwner);
    } catch (err: any) {
      toast.error(err.message);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDecide = async (status: 'completed', decision: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/organization/interviews', {
        method: 'PATCH',
        body: JSON.stringify({
          interview_id: id,
          status,
          notes: `${decision.toUpperCase()}: ${notes}`
        })
      });
      
      if (!res.ok) throw new Error('Failed to submit decision');
      
      toast.success(`Applicant ${decision}d successfully!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a1f] flex items-center justify-center">
       <div className="text-white font-black animate-pulse uppercase tracking-[0.5em]">Initializing Secure Room...</div>
    </div>
  );

  if (!interview) return null;

  return (
    <div className="min-h-screen bg-[#0a0a1f] flex flex-col font-sans">
      {/* Header */}
      <div className="bg-[#13132b] border-b border-white/5 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
            Interview Loop
          </div>
          <h1 className="text-white font-black text-lg tracking-tight uppercase">
            {interview.organization_memberships.organizations.name}
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
            <Clock size={16} />
            <span>ENCRYPTED SESSION: {formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 text-xs font-black uppercase tracking-widest border border-red-500/10 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} />
            Abort
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col md:flex-row gap-6 p-6">
        {/* Meet Iframe */}
        <div className="flex-grow bg-black rounded-[40px] overflow-hidden shadow-2xl relative min-h-[500px] border border-white/5">
          <iframe
            src={`${getJitsiMeetUrl(interview.room_id)}#userInfo.displayName="${user.user_metadata?.full_name || 'Expert'}"&config.prejoinPageEnabled=false&config.toolbarButtons=["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","profile","chat","recording","livestreaming","etherpad","sharedvideo","settings","raisehand","videoquality","filmstrip","invite","feedback","stats","shortcuts","tileview","videobackgroundblur","download","help","mute-everyone","security"]`}
            allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; spotlight"
            className="w-full h-full border-none"
          />
        </div>

        {/* Sidebar Controls (For Organization Host) */}
        {isHost && (
          <div className="w-full md:w-96 shrink-0 space-y-6">
            <div className="bg-[#13132b] p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Evaluation Engine</h3>
                <div className="space-y-4">
                  <button 
                    onClick={() => handleDecide('completed', 'approve')}
                    className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
                  >
                    <CheckCircle size={20} />
                    Approve & Affiliate
                  </button>
                  <button 
                    onClick={() => handleDecide('completed', 'reject')}
                    className="w-full py-4 bg-white/5 text-red-400 border border-red-500/10 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all"
                  >
                    <XCircle size={20} />
                    Reject Candidate
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Observation Notes</h3>
                <textarea 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-white h-48 focus:border-emerald-500/50 outline-none transition-all resize-none"
                  placeholder="Analyze cognitive depth, communication clarity, and technical intuition..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <p className="mt-4 text-[9px] text-gray-600 font-black uppercase leading-relaxed tracking-tighter">
                  Decision will atomically update the student's verification status and organization affiliation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
