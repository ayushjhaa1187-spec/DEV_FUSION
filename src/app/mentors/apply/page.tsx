'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  GraduationCap, 
  Clock, 
  Briefcase,
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Link as LinkIcon,
  Monitor
} from 'lucide-react';
import Link from 'next/link';

export default function MentorApplyPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    expertise: '',
    years_experience: 1,
    bio: '',
    linkedin_url: '',
    github_url: '',
    sample_work_url: '',
    availability_type: 'weekdays',
    work_mode: 'independent'
  });

  useEffect(() => {
    // Safety timeout to prevent infinite loader in case of auth race conditions
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    if (!authLoading && !user) {
      clearTimeout(safetyTimeout);
      router.push('/auth');
      return;
    }

    if (user) {
      checkApplicationStatus().then(() => clearTimeout(safetyTimeout));
    }

    return () => clearTimeout(safetyTimeout);
  }, [user, authLoading, router]);

  async function checkApplicationStatus() {
    try {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase
        .from('mentor_applications')
        .select('*')
        .eq('user_id', user?.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      setApplication(data);
    } catch (err: any) {
      console.error('Error checking application status:', err);
      // Don't set error state here to avoid preventing form from showing if it was just a transient DB error
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const expertiseArray = formData.expertise.split(',').map(s => s.trim()).filter(Boolean);
      
      const res = await fetch('/api/mentor-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expertise: expertiseArray
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSuccess(true);
      setApplication(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // If already approved
  if (profile?.role === 'mentor' || (application?.status === 'approved')) {
    return (
      <main className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShieldCheck className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tight">You're already a Mentor!</h1>
        <p className="text-gray-500 mb-10 text-lg">Thank you for contributing to the community. You can now access mentor-only features.</p>
        <Link href="/dashboard" className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition shadow-xl">
          Go to Dashboard
        </Link>
      </main>
    );
  }

  // Status Tracker Overlay
  if (application?.status === 'pending' && !success) {
    return (
      <main className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tight">Application Under Review</h1>
        <p className="text-gray-500 mb-6 text-lg">
          Your application was submitted on <strong>{new Date(application.submitted_at).toLocaleDateString()}</strong>.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left mb-10">
          <h3 className="font-bold text-sm uppercase tracking-widest text-indigo-400 mb-2">Next Steps</h3>
          <p className="text-sm text-gray-400">Our team reviews applications within 24-48 hours. We look for expertise, clear communication, and academic integrity.</p>
        </div>
        <Link href="/doubts" className="text-indigo-400 font-bold hover:underline">
          Browse the Doubt Feed in the meantime
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Info Side */}
        <div>
          <h1 className="text-5xl font-black mb-8 leading-[1.1] tracking-tighter">
            Join the <span className="text-indigo-500 text-gradient bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">Mentor Elite</span>
          </h1>
          <p className="text-gray-400 text-lg mb-12 leading-relaxed">
            The SkillBridge Mentor Program connects top-performing students with peers who need guidance. Help others, build your portfolio, and earn exclusive badges.
          </p>

          <div className="space-y-8">
            {[
              { icon: Briefcase, title: 'Professional Growth', desc: 'Add "Community Mentor" to your resume and LinkedIn.' },
              { icon: GraduationCap, title: 'Academic Impact', desc: 'Directly influence the learning journey of fellow students.' },
              { icon: CheckCircle, title: 'Verified Status', desc: 'Get a blue checkmark on your profile and answers.' },
            ].map((perk, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                  <perk.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-black text-lg mb-1">{perk.title}</h3>
                  <p className="text-sm text-gray-500">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Side */}
        <div className="bg-[#13132b] border border-white/5 rounded-[48px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-10" />
          
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black mb-4">Application Sent!</h2>
                <p className="text-gray-400 mb-8">We've received your application. Hang tight while we review your credentials.</p>
                <button onClick={() => router.push('/dashboard')} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl">
                  Back to Dashboard
                </button>
              </motion.div>
            ) : (
              <motion.form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Expertise (comma separated)</label>
                  <input
                    required
                    placeholder="React, CSS, DSA, Python..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 transition font-medium"
                    value={formData.expertise}
                    onChange={e => setFormData({...formData, expertise: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Years of Exp</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 transition font-medium"
                      value={formData.years_experience}
                      onChange={e => setFormData({...formData, years_experience: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="flex items-end pb-4">
                    <span className="text-xs text-gray-600 font-bold">Years of relevant academic or project experience.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Short Bio</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your background and why you want to mentor..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 transition font-medium text-sm leading-relaxed"
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                  />
                  <div className="mt-2 text-[10px] text-gray-600 font-bold text-right">Min. 20 characters</div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="relative">
                    <LinkIcon className="absolute left-5 top-4 w-5 h-5 text-gray-500" />
                    <input
                      type="url"
                      placeholder="LinkedIn URL (Optional)"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-indigo-500/50 transition font-medium text-sm"
                      value={formData.linkedin_url}
                      onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <Monitor className="absolute left-5 top-4 w-5 h-5 text-gray-500" />
                    <input
                      type="url"
                      placeholder="GitHub URL (Optional)"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-indigo-500/50 transition font-medium text-sm"
                      value={formData.github_url}
                      onChange={e => setFormData({...formData, github_url: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Availability</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 transition font-medium text-sm appearance-none cursor-pointer"
                      value={formData.availability_type}
                      onChange={e => setFormData({...formData, availability_type: e.target.value})}
                    >
                      <option value="weekdays" className="bg-[#13132b]">Weekdays (Mon-Fri)</option>
                      <option value="weekends" className="bg-[#13132b]">Weekends (Sat-Sun)</option>
                    </select>
                    <div className="mt-2 text-[10px] text-gray-600 font-bold ml-1">
                      This helps us recommend you for the right sessions.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Collaborative Preference</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, work_mode: 'independent'})}
                        className={`p-4 rounded-2xl border text-center transition-all ${formData.work_mode === 'independent' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                      >
                         <span className="block text-xs font-black uppercase tracking-widest mb-1">Independent</span>
                         <span className="text-[10px] opacity-60">Teach solo</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, work_mode: 'organization'})}
                        className={`p-4 rounded-2xl border text-center transition-all ${formData.work_mode === 'organization' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                      >
                         <span className="block text-xs font-black uppercase tracking-widest mb-1">Organization</span>
                         <span className="text-[10px] opacity-60">Join a team</span>
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-bold">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 bg-indigo-600 disabled:opacity-50 text-white font-black rounded-2xl hover:bg-indigo-500 transition shadow-xl flex items-center justify-center gap-3 overflow-hidden group"
                >
                  {submitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
