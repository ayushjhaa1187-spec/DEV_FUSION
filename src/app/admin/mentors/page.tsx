'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Users, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Loader2,
  AlertCircle,
  Mail,
  Linkedin,
  Github
} from 'lucide-react';

export default function AdminMentorsPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchApplications();
  }, [authLoading, profile, router]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor-applications?status=pending');
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, status: 'approved' | 'rejected') {
    setProcessingId(id);
    try {
      const res = await fetch('/api/mentor-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        setApplications(prev => prev.filter(app => app.id !== id));
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setProcessingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a16]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a16] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-xs mb-2">
              <ShieldCheck size={14} />
              Admin Control
            </div>
            <h1 className="text-4xl font-black tracking-tight">Mentor Applications</h1>
          </div>
          <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
            <Users className="text-gray-500" size={20} />
            <span className="font-bold text-gray-300">{applications.length} Pending</span>
          </div>
        </header>

        {applications.length === 0 ? (
          <div className="bg-[#13132b] border border-white/5 rounded-[32px] p-20 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-emerald-500" size={32} />
            </div>
            <h3 className="text-2xl font-black mb-2">All Caught Up!</h3>
            <p className="text-gray-500 max-w-sm mx-auto">There are no pending mentor applications to review at this time.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {applications.map((app) => (
              <div 
                key={app.id} 
                className="bg-[#13132b] border border-white/5 rounded-[32px] p-8 flex flex-col md:flex-row gap-8 items-start transition hover:border-white/10"
              >
                {/* User Info */}
                <div className="flex-shrink-0 w-full md:w-64">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={app.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.profiles?.username}`} 
                      className="w-12 h-12 rounded-xl bg-gray-800"
                      alt=""
                    />
                    <div>
                      <h4 className="font-black text-white">{app.profiles?.full_name || app.profiles?.username}</h4>
                      <p className="text-xs text-gray-500 font-bold">@{app.profiles?.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {app.linkedin_url && (
                      <a href={app.linkedin_url} target="_blank" className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-indigo-400">
                        <Linkedin size={16} />
                      </a>
                    )}
                    {app.github_url && (
                      <a href={app.github_url} target="_blank" className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-indigo-400">
                        <Github size={16} />
                      </a>
                    )}
                  </div>
                  <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-indigo-400 block mb-1">Expertise</span>
                    <div className="flex flex-wrap gap-1">
                      {app.expertise.map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Statement of Purpose / Bio</span>
                    <p className="text-gray-300 text-sm leading-relaxed">{app.bio}</p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 p-3 rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">Experience</span>
                      <span className="text-sm font-bold">{app.years_experience} Years</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">Availability</span>
                      <span className="text-sm font-bold uppercase">{app.availability_type}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full md:w-48">
                  <button
                    disabled={processingId === app.id}
                    onClick={() => handleAction(app.id, 'approved')}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition flex items-center justify-center gap-2 group"
                  >
                    {processingId === app.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    Approve
                  </button>
                  <button
                    disabled={processingId === app.id}
                    onClick={() => handleAction(app.id, 'rejected')}
                    className="w-full py-4 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-500 font-black rounded-2xl transition flex items-center justify-center gap-2"
                  >
                    {processingId === app.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
