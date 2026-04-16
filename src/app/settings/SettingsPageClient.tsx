'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Save, AlertTriangle, Upload, Github, Linkedin, 
  Twitter, Globe, X, Plus, ShieldCheck, User,
  Mail, BookOpen, GraduationCap, MapPin, Sparkles,
  Calendar, Clock, UserCheck
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { motion, AnimatePresence } from 'framer-motion';
import ReputationBadge from '@/components/user/ReputationBadge';
import AvailabilityGrid from '@/components/settings/AvailabilityGrid';
import CouponWidget from '@/components/billing/CouponWidget';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

type ProfileFormData = {
  full_name?: string;
  college?: string;
  branch?: string;
  semester?: number;
  bio?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  subjects?: string[];
};

export default function SettingsPageClient() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'mentorship' | 'subscription'>('profile');

  const { register, handleSubmit, setValue, watch, control, reset } = useForm<ProfileFormData>({
    defaultValues: {
      subjects: []
    }
  });

  const subjects = watch('subjects') || [];
  const watchedFields = watch();
  const debouncedFormData = useDebounce(watchedFields, 2000);

  // Auto-save logic (Priority 3 & 9)
  useEffect(() => {
    if (loading || authLoading || !profileData || activeTab !== 'profile') return;

    const currentData = {
      full_name: profileData.full_name || '',
      college: profileData.college || '',
      branch: profileData.branch || '',
      semester: Number(profileData.semester) || 1,
      bio: profileData.bio || '',
      github_url: profileData.github_url || '',
      linkedin_url: profileData.linkedin_url || '',
      twitter_url: profileData.twitter_url || '',
      website_url: profileData.website_url || '',
      subjects: profileData.subjects || []
    };

    // Minor normalization for comparison
    const normalizedDebounced = {
      ...debouncedFormData,
      semester: Number(debouncedFormData.semester)
    };

    if (JSON.stringify(normalizedDebounced) !== JSON.stringify(currentData)) {
      onSubmit(debouncedFormData);
      // Update local profileData to prevent loop
      setProfileData({ ...profileData, ...debouncedFormData });
    }
  }, [debouncedFormData, loading, authLoading, profileData, activeTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth');
      return;
    }

    let isMounted = true;
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/profile');
        const resData = await res.json();
        
        if (resData.success && isMounted) {
          const { profile: data } = resData.data;
          setProfileData(data);
          setAvatarUrl(data.avatar_url);
          reset({
            full_name: data.full_name || '',
            college: data.college || '',
            branch: data.branch || '',
            semester: data.semester || 1,
            bio: data.bio || '',
            github_url: data.github_url || '',
            linkedin_url: data.linkedin_url || '',
            twitter_url: data.twitter_url || '',
            website_url: data.website_url || '',
            subjects: data.subjects || []
          });
        }
      } catch (e) {
        console.error('Settings load failed:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProfile();
    return () => { isMounted = false; };
  }, [user, authLoading, reset, router]); // Removed profileData dependency

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      toast.success('Avatar updated!');
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const addSubject = () => {
    if (subjectInput.trim() && !subjects.includes(subjectInput.trim())) {
      setValue('subjects', [...subjects, subjectInput.trim()]);
      setSubjectInput('');
    }
  };

  const removeSubject = (index: number) => {
    const newSubjects = [...subjects];
    newSubjects.splice(index, 1);
    setValue('subjects', newSubjects);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAvailability = async (schedule: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ availability: schedule })
        .eq('id', user?.id);
      
      if (error) throw error;
      toast.success('Availability schedule updated!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-6 min-h-[60vh]">
       <div className="relative">
         <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500/20 border-t-indigo-500" />
         <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-400 animate-pulse" />
       </div>
       <div className="text-center">
         <p className="text-white font-black uppercase tracking-[0.2em] text-sm mb-2">Syncing Neural Profile</p>
         <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Establishing secure link to SkillBridge Network...</p>
       </div>
    </div>
  );

  if (!user) return null;

  if (loading && !profileData) return (
    <div className="flex flex-col items-center justify-center p-20 gap-6 min-h-[60vh]">
       <div className="animate-pulse flex flex-col items-center gap-4">
         <div className="h-12 w-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
         </div>
         <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Accessing Secure Data Bundles...</p>
       </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Settings Form */}
      <div className="lg:col-span-2 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[9px] font-black text-indigo-400 uppercase tracking-widest">System v2.4</div>
              <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Node: {profileData?.college || 'External'}</div>
            </div>
            <h1 className="text-5xl font-black text-white font-heading tracking-tight leading-none">Console</h1>
            <p className="text-gray-500 mt-3 font-medium text-sm max-w-md italic">Fine-tune your cognitive presence and academic parameters within the SkillBridge ecosystem.</p>
          </div>
          
          <div className="flex bg-white/5 p-1.5 rounded-[20px] border border-white/5 backdrop-blur-xl shadow-2xl">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              Identity
            </button>
            <button 
              onClick={() => setActiveTab('subscription')}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                activeTab === 'subscription' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              Subscription
            </button>
            <button 
              onClick={() => setActiveTab('mentorship')}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                activeTab === 'mentorship' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              Mentorship
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                 {/* Identity Content */}
                 <section className="bg-white/5 rounded-3xl p-8 border border-white/5 backdrop-blur-xl">
                   <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                     <User className="w-5 h-5 text-indigo-400" />
                     Public Identity
                   </h2>
                   <div className="flex flex-col md:flex-row gap-8 items-start">
                     <div className="relative group">
                       <div className="w-32 h-32 rounded-3xl bg-white/10 overflow-hidden ring-4 ring-white/5 group-hover:ring-indigo-500/30 transition-all">
                         {avatarUrl ? (
                           <Image src={avatarUrl} alt="Avatar" width={128} height={128} loading="lazy" className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center text-3xl font-black">{watchedFields.full_name?.[0] || 'U'}</div>
                         )}
                       </div>
                       <label className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 rounded-xl cursor-pointer hover:bg-indigo-500 transition-all shadow-xl">
                         <Upload className="w-4 h-4 text-white" />
                         <input type="file" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                       </label>
                     </div>
                     
                     <div className="flex-1 w-full space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1 font-bold uppercase text-[10px] tracking-widest">Full Display Name</label>
                         <input {...register('full_name')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50" placeholder="e.g. Ayush Jha" />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1 font-bold uppercase text-[10px] tracking-widest">Bio / Mission Statement</label>
                         <textarea {...register('bio')} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50" placeholder="Tell the community about your expertise..." />
                       </div>
                     </div>
                   </div>
                 </section>

                 <section className="bg-white/5 rounded-3xl p-8 border border-white/5 backdrop-blur-xl">
                   <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                     <GraduationCap className="w-5 h-5 text-emerald-400" />
                     Academic Credentials
                   </h2>
                   {/* Academic Fields */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-400 mb-1 font-bold uppercase text-[10px] tracking-widest">College / University</label>
                       <input {...register('college')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50" />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-400 mb-1 font-bold uppercase text-[10px] tracking-widest">Department / Branch</label>
                       <input {...register('branch')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50" />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-400 mb-1 font-bold uppercase text-[10px] tracking-widest">Current Semester</label>
                       <select {...register('semester', { valueAsNumber: true })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50">
                         {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} className="bg-slate-900 font-bold">Semester {s}</option>)}
                       </select>
                     </div>
                   </div>
                 </section>

                 <div className="flex justify-end pt-4">
                   <button type="submit" disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black shadow-2xl transition-all uppercase tracking-widest text-sm">
                     {saving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-5 h-5" />}
                     Commit Changes
                   </button>
                 </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'subscription' && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
               <div className="bg-white/5 p-10 rounded-[40px] border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px]" />
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-10">
                        <div>
                           <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full inline-flex items-center gap-2 mb-4">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Neural Tier Beta</span>
                           </div>
                           <h3 className="text-3xl font-black tracking-tight text-white">Platform Subscription</h3>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Status</p>
                           <p className="text-sm font-bold text-emerald-400">Synchronized</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <div className="p-6 bg-white/5 rounded-3xl border border-transparent hover:border-indigo-500/20 transition-all">
                           <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">My Active Plan</p>
                           <p className="text-lg font-black text-white">{profileData?.subscription_plan || 'Standard Scholar'}</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-3xl border border-transparent hover:border-indigo-500/20 transition-all text-right">
                           <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">Billing Cycle</p>
                           <p className="text-sm font-bold text-gray-300">Continuous Academic Link</p>
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/20">
                        <div className="text-white text-center md:text-left">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Boost your potential</p>
                           <p className="text-lg font-black tracking-tight">Expand Neural Solves</p>
                        </div>
                        <button onClick={() => router.push('/pricing')} className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                           Explore Tiers
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'mentorship' && (
            <motion.div
              key="mentorship"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Mentorship Content (Existing) */}
              <section className="bg-white/5 rounded-3xl p-8 border border-white/5 backdrop-blur-xl">
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-indigo-400" />
                       Expert Status
                    </h2>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                       profileData?.role === 'mentor' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-gray-500/10 text-gray-500 border-white/5'
                    }`}>
                       {profileData?.role === 'mentor' ? 'Active Expert' : 'Regular Access'}
                    </div>
                 </div>
                 {profileData?.role !== 'mentor' ? (
                    <div className="py-12 text-center space-y-4">
                       <UserCheck className="w-16 h-16 text-gray-700 mx-auto opacity-20" />
                       <h3 className="text-xl font-bold text-gray-300">Apply for Expert Role</h3>
                       <p className="text-gray-500 max-w-md mx-auto text-sm">Requires 500+ Reputation points and Academic Verification.</p>
                       <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 font-bold text-sm">COMING SOON</button>
                    </div>
                 ) : (
                    <AvailabilityGrid initialData={profileData?.availability} onSave={saveAvailability} saving={saving} />
                 )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Preview Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Upgrade Access
            </h3>
          </div>

          <CouponWidget />

          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Real-time Simulation
            </h3>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-900/40 via-slate-900 to-black rounded-[2.5rem] p-8 border border-white/10 shadow-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <ReputationBadge points={profileData?.reputation_points || 0} />
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/20 overflow-hidden mb-4 ring-4 ring-white/5 group-hover:scale-105 transition-all">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="User avatar" width={96} height={96} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white/20">{watchedFields.full_name?.[0] || 'U'}</div>
                )}
              </div>
              
              <h4 className="text-2xl font-black text-white mb-1 leading-tight">
                {watchedFields.full_name || 'Anonymous User'}
              </h4>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mb-4">
                <ShieldCheck className="w-3 h-3" />
                {profileData?.role || 'student'}
              </p>
              
              <p className="text-gray-400 text-sm line-clamp-3 min-h-[3rem] mb-6 px-4 italic leading-relaxed">
                "{watchedFields.bio || 'Your transmission signature appears here...'}"
              </p>
              
              <div className="w-full grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <div className="text-[9px] text-gray-500 uppercase font-black mb-1">NODE</div>
                  <div className="text-[11px] text-white font-bold truncate">{watchedFields.college || 'STAGING'}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <div className="text-[9px] text-gray-500 uppercase font-black mb-1">PHASE</div>
                  <div className="text-[11px] text-white font-bold text-center">SEM {watchedFields.semester || 'X'}</div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Twitter className={`w-5 h-5 transition-all ${watchedFields.twitter_url ? 'text-sky-400' : 'text-white/5'}`} />
                <Github className={`w-5 h-5 transition-all ${watchedFields.github_url ? 'text-white' : 'text-white/5'}`} />
                <Linkedin className={`w-5 h-5 transition-all ${watchedFields.linkedin_url ? 'text-blue-500' : 'text-white/5'}`} />
                <Globe className={`w-5 h-5 transition-all ${watchedFields.website_url ? 'text-emerald-400' : 'text-white/5'}`} />
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="text-[10px] text-gray-500 uppercase font-black mb-3 tracking-widest">Expertise Pulse</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {subjects.slice(0, 4).map(s => (
                  <span key={s} className="px-2 py-1 bg-indigo-500/10 rounded-md text-[9px] text-indigo-300 border border-indigo-500/20 font-black uppercase">{s}</span>
                ))}
                {subjects.length > 4 && <span className="text-[10px] text-gray-500">+{subjects.length - 4} more</span>}
                {subjects.length === 0 && <span className="text-[10px] text-gray-700 italic font-bold">Awaiting Data</span>}
              </div>
            </div>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
             <p className="text-[10px] text-amber-200/60 font-medium leading-relaxed">
                <span className="text-amber-400 font-bold block mb-1 uppercase tracking-wider">Security Warning</span>
                Social links and bio are visible to all users. Avoid sharing private sensitive data in these fields.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
