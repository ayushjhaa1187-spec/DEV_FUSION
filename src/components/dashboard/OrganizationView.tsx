'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Users, Video, FileText, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { generateJitsiRoomName } from '@/lib/jitsi';

export default function OrganizationView({ orgId }: { orgId: string }) {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrgData();
  }, [orgId]);

  const fetchOrgData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Applicants
      const { data: appData, error: appError } = await supabase
        .from('organization_memberships')
        .select('*, profiles(username, full_name, avatar_url, reputation_points)')
        .eq('organization_id', orgId)
        .in('status', ['pending', 'interviewing']);

      if (appError) throw appError;
      setApplicants(appData || []);

      // 2. Fetch Interviews
      const { data: intData, error: intError } = await supabase
        .from('organization_interviews')
        .select('*, organization_memberships(profiles(full_name))')
        .eq('status', 'scheduled');

      if (intError) throw intError;
      setInterviews(intData || []);

    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async (membershipId: string) => {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Default to tomorrow
    const roomId = generateJitsiRoomName(`interview-${membershipId}`);

    try {
      const { error: intError } = await supabase
        .from('organization_interviews')
        .insert({
          membership_id: membershipId,
          scheduled_at: scheduledAt,
          room_id: roomId
        });

      if (intError) throw intError;

      const { error: memError } = await supabase
        .from('organization_memberships')
        .update({ status: 'interviewing' })
        .eq('id', membershipId);

      if (memError) throw memError;

      showToast('Interview scheduled and room created!', 'success');
      fetchOrgData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateStatus = async (membershipId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .update({ status })
        .eq('id', membershipId);

      if (error) throw error;
      showToast(`Applicant ${status} successfully.`, 'success');
      fetchOrgData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-40 bg-white/5 rounded-xl" /></div>;

  return (
    <div className="space-y-8">
      {/* Interviews Section */}
      <section>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Video className="text-primary w-5 h-5" />
          Upcoming Interviews
        </h3>
        {interviews.length === 0 ? (
          <p className="text-text-secondary italic">No interviews scheduled yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviews.map((interview) => (
              <Card key={interview.id} className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white">{interview.organization_memberships?.profiles?.full_name}</h4>
                      <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {new Date(interview.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => window.open(`/organizations/interview/${interview.id}`, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink size={14} />
                      Join Meet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Applicants Section */}
      <section>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="text-secondary w-5 h-5" />
          Pending Applicants
        </h3>
        {applicants.length === 0 ? (
          <p className="text-text-secondary italic">No active applications currently.</p>
        ) : (
          <div className="space-y-4">
            {applicants.map((app) => (
              <Card key={app.id} variant="elevated">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center font-bold text-xl">
                        {app.profiles?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{app.profiles?.full_name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary">{app.profiles?.reputation_points} Rep</Badge>
                          <span className="text-xs text-text-tertiary">Applied {new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <Button variant="secondary" size="sm" className="gap-2" onClick={() => window.open(app.resume_url, '_blank')}>
                        <FileText size={16} />
                        Resume
                      </Button>
                      
                      {app.status === 'pending' ? (
                        <Button variant="primary" size="sm" className="gap-2" onClick={() => handleScheduleInterview(app.id)}>
                          <Video size={16} />
                          Invite to Interview
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-400/10 gap-1" onClick={() => handleUpdateStatus(app.id, 'approved')}>
                            <CheckCircle size={16} />
                            Approve
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-400/10 gap-1" onClick={() => handleUpdateStatus(app.id, 'rejected')}>
                            <XCircle size={16} />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
