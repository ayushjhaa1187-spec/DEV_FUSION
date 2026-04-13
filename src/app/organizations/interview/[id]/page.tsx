'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Clock, Video, Mic, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { getJitsiMeetUrl } from '@/lib/jitsi';

export default function InterviewRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createSupabaseBrowser();
  const { showToast } = useToast();
  
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 2 hours in seconds
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (user) fetchInterview();
  }, [id, user]);

  useEffect(() => {
    if (timeLeft <= 0) {
      showToast('Interview time limit reached.', 'warning');
      router.push('/dashboard');
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

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
        showToast('Unauthorized access to this interview room.', 'error');
        return router.push('/dashboard');
      }

      setInterview(data);
      setIsHost(isOrgOwner);
    } catch (err: any) {
      showToast(err.message, 'error');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Initializing Secure Room...</div>;
  if (!interview) return null;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="bg-bg-secondary border-b border-border-color p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="primary" className="px-3 py-1">Interview Room</Badge>
          <h1 className="text-white font-bold text-lg hidden md:block">
            {interview.organization_memberships.organizations.name} Recruitment
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-sm bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
            <Clock size={16} />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="text-red-400 border-red-400/20 hover:bg-red-400/10">
            <LogOut size={16} className="mr-2" />
            Leave
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col md:flex-row gap-4 p-4">
        {/* Meet Iframe */}
        <div className="flex-grow bg-black rounded-2xl overflow-hidden shadow-2xl relative min-h-[500px]">
          <iframe
            src={`${getJitsiMeetUrl(interview.room_id)}#userInfo.displayName="${user.user_metadata?.full_name || 'User'}"&config.prejoinPageEnabled=false`}
            allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; spotlight"
            className="w-full h-full border-none"
          />
        </div>

        {/* Sidebar Controls (For Organization Host) */}
        {isHost && (
          <Card className="w-full md:w-80 bg-bg-secondary shrink-0 overflow-auto">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-4">Host Controls</h3>
                <div className="space-y-3">
                  <Button variant="primary" className="w-full justify-start gap-2 bg-green-500 hover:bg-green-600" onClick={async () => {
                    await supabase.from('organization_memberships').update({ status: 'approved' }).eq('id', interview.membership_id);
                    await supabase.from('organization_interviews').update({ status: 'completed' }).eq('id', id);
                    showToast('Mentor approved! Redirecting...', 'success');
                    router.push('/dashboard');
                  }}>
                    <CheckCircle size={18} />
                    Approve Applicant
                  </Button>
                  <Button variant="secondary" className="w-full justify-start gap-2 border-red-500/20 text-red-400" onClick={async () => {
                   await supabase.from('organization_memberships').update({ status: 'rejected' }).eq('id', interview.membership_id);
                   await supabase.from('organization_interviews').update({ status: 'completed' }).eq('id', id);
                   showToast('Application declined.', 'info');
                   router.push('/dashboard');
                  }}>
                    <XCircle size={18} />
                    Reject Applicant
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-border-color">
                <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-2">Recruitment Notes</h3>
                <textarea 
                  className="w-full bg-bg-primary border border-border-color rounded-xl p-3 text-sm text-white h-40 focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Type interview notes here... (Not saved automatically)"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-bg-secondary border-t border-border-color text-center text-xs text-text-tertiary">
        Secure P2P Encryption Active • Non-stop 2hr Session Link • Room: {interview.room_id}
      </div>
    </div>
  );
}
