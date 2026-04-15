'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Users, Video, FileText, CheckCircle, XCircle, Clock, ExternalLink, Briefcase, Search, UserPlus } from 'lucide-react';
import { generateJitsiRoomName } from '@/lib/jitsi';
import { toast } from 'sonner';
import { TalentDirectory } from './TalentDirectory';
import Image from 'next/image';

export default function OrganizationView({ orgId }: { orgId: string }) {
  const [activeTab, setActiveTab] = useState<'applicants' | 'interviews' | 'directory'>('applicants');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    fetchOrgData();
  }, [orgId, activeTab]);

  const fetchOrgData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'applicants') {
        const { data, error } = await supabase
          .from('organization_memberships')
          .select('*, profiles(username, full_name, avatar_url, reputation_points)')
          .eq('organization_id', orgId)
          .in('status', ['pending', 'interviewing']);
        if (error) throw error;
        setApplicants(data || []);
      } else if (activeTab === 'interviews') {
        const { data, error } = await supabase
          .from('organization_interviews')
          .select('*, organization_memberships(profiles(full_name))')
          .eq('status', 'scheduled');
        if (error) throw error;
        setInterviews(data || []);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async (membershipId: string) => {
    try {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch('/api/organization/interviews', {
        method: 'POST',
        body: JSON.stringify({ membership_id: membershipId, scheduled_at: scheduledAt })
      });
      if (!res.ok) throw new Error('Schedule failed');
      toast.success('Interview session initialized.');
      fetchOrgData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl w-fit border border-white/5">
        {[
          { id: 'applicants', label: 'Candidate Queue', icon: Users },
          { id: 'interviews', label: 'Live Sessions', icon: Video },
          { id: 'directory', label: 'Ecosystem Talent', icon: Search }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading && activeTab !== 'directory' ? (
        <div className="grid grid-cols-1 gap-6">
           {[1, 2].map(i => <div key={i} className="h-32 bg-white/5 rounded-[32px] animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === 'applicants' && (
            <div className="space-y-6">
              {applicants.length === 0 ? (
                <EmptyState icon={Users} title="Empty Queue" subtitle="No active candidates awaiting evaluation." />
              ) : (
                applicants.map((app) => (
                  <div key={app.id} className="bg-[#13132b] p-8 rounded-[40px] border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-black text-white">
                          {app.profiles?.full_name?.charAt(0) || 'U'}
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-white tracking-tight uppercase leading-none mb-2">{app.profiles?.full_name}</h4>
                          <div className="flex items-center gap-4">
                             <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                <Trophy size={12} /> {app.profiles?.reputation_points} Reputation
                             </div>
                             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                               Applied {new Date(app.created_at).toLocaleDateString()}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                       {app.resume_url && (
                         <button 
                           onClick={() => window.open(app.resume_url, '_blank')}
                           className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                         >
                            <FileText size={16} /> Resume
                         </button>
                       )}
                       
                       {app.status === 'pending' ? (
                         <button 
                           onClick={() => handleScheduleInterview(app.id)}
                           className="px-8 py-3 rounded-2xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-[1.05] transition-transform flex items-center gap-2"
                         >
                            <Video size={16} /> Invite to Loop
                         </button>
                       ) : (
                         <div className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10">
                            <Clock size={14} /> Interviewing
                         </div>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {interviews.length === 0 ? (
                 <div className="col-span-2"><EmptyState icon={Video} title="Clear Schedule" subtitle="No live evaluation sessions pending." /></div>
               ) : (
                 interviews.map((interview) => (
                   <div key={interview.id} className="bg-[#13132b] p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-amber-500/10 transition-colors">
                         <Video size={80} />
                      </div>
                      <div className="relative z-10">
                         <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-1">
                            <Clock size={12} /> {new Date(interview.scheduled_at).toLocaleString()}
                         </div>
                         <h4 className="text-2xl font-black text-white tracking-tighter uppercase mb-6 truncate max-w-[200px]">
                            {interview.organization_memberships?.profiles?.full_name}
                         </h4>
                         <button 
                           onClick={() => window.open(`/organizations/interview/${interview.id}`, '_blank')}
                           className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all flex items-center justify-center gap-3 group/btn"
                         >
                            Authorize & Join Workspace <ExternalLink size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                         </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          )}

          {activeTab === 'directory' && <TalentDirectory />}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center">
       <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 mb-6">
          <Icon size={32} />
       </div>
       <h4 className="text-xl font-black text-white uppercase tracking-tight">{title}</h4>
       <p className="text-gray-500 text-sm mt-2 max-w-[200px] font-medium leading-relaxed">{subtitle}</p>
    </div>
  );
}

const Trophy = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
  </svg>
);
