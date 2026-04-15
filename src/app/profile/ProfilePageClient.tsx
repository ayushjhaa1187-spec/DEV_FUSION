'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormInput, FormTextarea } from '@/components/ui/FormInput';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { MetricCard } from '@/components/ui/MetricCard';
import { AchievementCard } from '@/components/ui/AchievementCard';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Trophy, Flame, Target, MessageSquare, Briefcase, Eye, Link as LinkIcon, Edit3 } from 'lucide-react';

export default function ProfilePageClient({ user, initialProfile, initialBadges }: { user: any, initialProfile: any, initialBadges: any[] }) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(initialProfile);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: profile?.full_name || '',
    bio: profile?.bio || '',
    college: profile?.college || '',
    branch: profile?.branch || '',
    semester: profile?.semester || '',
    github: profile?.social_links?.github || '',
    linkedin: profile?.social_links?.linkedin || '',
  });

  const [privacy, setPrivacy] = useState(profile?.privacy_settings || {
    showEmail: false,
    showCollege: true,
    showBranch: true,
    showSemester: true,
    showSocialLinks: true,
    showActivity: true
  });

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        if (data.success) {
          setActivities(data.data.recent_activity || []);
        }
      } catch (err) {
        console.error('Failed to fetch profile activity:', err);
      } finally {
        setLoadingActivity(false);
      }
    }
    fetchActivity();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.name,
        bio: formData.bio,
        college: formData.college,
        branch: formData.branch,
        semester: parseInt(formData.semester) || null,
        social_links: { github: formData.github, linkedin: formData.linkedin },
        privacy_settings: privacy
      }).eq('id', user.id);

      if (error) throw error;
      showToast('Profile updated strictly to specs!', 'success');
      setIsEditOpen(false);
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
     let score = 0;
     if (profile?.full_name) score += 20;
     if (profile?.college) score += 20;
     if (profile?.branch) score += 20;
     if (profile?.bio) score += 20;
     if (profile?.social_links?.github || profile?.social_links?.linkedin) score += 20;
     return score;
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Header Card */}
      <Card variant="elevated" className="overflow-hidden">
        <div className="h-32 bg-primary/10 w-full relative">
           <div className="absolute -bottom-10 left-8">
             <Avatar 
               userId={user.id} 
               name={profile?.full_name?.substring(0, 2).toUpperCase() || 'US'} 
               size="lg" 
               className="border-4 border-bg-primary h-24 w-24 shadow-md bg-bg-secondary"
             />
           </div>
           <div className="absolute top-4 right-4">
             <Button variant="secondary" icon={<Edit3 size={16} />} onClick={() => setIsEditOpen(true)}>
               Edit Profile
             </Button>
           </div>
        </div>
        <CardContent className="pt-14 pb-6 px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
             <div className="space-y-2">
                <h1 className="text-2xl font-heading font-bold text-text-primary flex items-center gap-3">
                   {profile?.full_name || 'Anonymous User'} 
                   <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                     {profile?.current_level || 'Novice'}
                   </span>
                </h1>
                <p className="text-text-secondary max-w-xl">{profile?.bio || 'No bio provided.'}</p>
                
                <div className="flex flex-wrap gap-4 mt-4 text-sm font-medium text-text-tertiary">
                   {profile?.college && <span className="flex items-center gap-1.5"><Briefcase size={16}/> {profile.college}</span>}
                   {profile?.social_links?.github && <a href={formData.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline"><LinkIcon size={16}/> GitHub</a>}
                   {profile?.social_links?.linkedin && <a href={formData.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#0077b5] hover:underline"><LinkIcon size={16}/> LinkedIn</a>}
                </div>
             </div>
             
             <div className="flex shrink-0 gap-3 border border-border-color bg-bg-secondary p-4 rounded-2xl">
                <div className="text-center px-4">
                   <div className="text-2xl font-bold text-text-primary">{profile?.reputation_points || 0}</div>
                   <div className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">Reputation</div>
                </div>
                <div className="w-px bg-border-color" />
                <div className="text-center px-4">
                   <div className="text-2xl font-bold text-text-primary">{profile?.login_streak || 0}</div>
                   <div className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">Day Streak</div>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-8">
           <MetricCard 
             label="Profile Completion" 
             value={`${calculateCompletion()}%`} 
             icon={<Target size={20} />} 
             trend={{ direction: 'up', value: calculateCompletion(), label: 'completed' }}
           />

           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Trophy className="text-primary"/> Latest Badges</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {initialBadges.length > 0 ? initialBadges.slice(0, 3).map((ub: any) => (
                  <AchievementCard 
                    key={ub.badges.id}
                    title={ub.badges.name}
                    description={ub.badges.description}
                    icon={<MessageSquare size={24} />}
                    isUnlocked={true}
                    earnedAt={ub.unlocked_at}
                  />
               )) : (
                 <div className="text-sm text-text-secondary text-center py-4 bg-bg-secondary rounded-xl border border-dashed border-border-color">
                   No badges unlocked yet. Join the conversation to earn!
                 </div>
               )}
             </CardContent>
           </Card>
        </div>

        <div className="md:col-span-2">
           <Card>
              <CardContent className="pt-6">
                <Tabs 
                   tabs={[
                      { 
                        id: 'activity', 
                        label: 'Recent Activity', 
                        content: <ActivityList activities={activities} loading={loadingActivity} /> 
                      },
                      { id: 'doubts', label: 'Doubts Asked', content: <div className="py-8 text-center text-text-tertiary border-2 border-dashed border-border-color rounded-2xl">Your doubts will appear here in the next phase.</div> },
                      { id: 'answers', label: 'Answers', content: <div className="py-8 text-center text-text-tertiary border-2 border-dashed border-border-color rounded-2xl">Your contributions will appear here in the next phase.</div> }
                   ]}
                />
              </CardContent>
           </Card>
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Public Profile" size="lg">
         <form onSubmit={handleUpdate} className="space-y-6">
           <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Personal Info</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput id="name" label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required/>
              <FormInput id="college" label="College/University" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} required/>
              <FormInput id="branch" label="Major/Branch" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} />
              <FormInput id="semester" label="Semester" type="number" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} />
           </div>

           <FormTextarea id="bio" label="About Me" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />

           <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary pt-4 border-t border-border-color">Social Connect</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput id="github" label="GitHub Profile URL" value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})}/>
              <FormInput id="linkedin" label="LinkedIn Profile URL" value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})}/>
           </div>

           <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary pt-4 border-t border-border-color flex items-center gap-2"><Eye size={16}/> Privacy Settings</h3>
           <div className="grid grid-cols-2 gap-4 bg-bg-secondary p-4 rounded-xl border border-border-color">
              <label className="flex items-center gap-3 text-sm font-semibold text-text-primary">
                <input type="checkbox" checked={privacy.showCollege} onChange={(e) => setPrivacy({...privacy, showCollege: e.target.checked})} className="accent-primary w-4 h-4"/>
                Show College publicly
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-text-primary">
                <input type="checkbox" checked={privacy.showSocialLinks} onChange={(e) => setPrivacy({...privacy, showSocialLinks: e.target.checked})} className="accent-primary w-4 h-4"/>
                Show Social Links
              </label>
           </div>

           <div className="flex justify-end pt-4">
             <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)} className="mr-3">Cancel</Button>
             <Button type="submit" variant="primary" loading={loading}>Save Profile</Button>
           </div>
         </form>
      </Modal>
    </div>
  );
}

function ActivityList({ activities, loading }: { activities: any[], loading: boolean }) {
  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-black/5 animate-pulse rounded-2xl" />
      ))}
    </div>
  );

  if (activities.length === 0) return (
    <div className="py-12 text-center text-text-tertiary border-2 border-dashed border-border-color rounded-2xl">
      <MessageSquare className="mx-auto mb-4 opacity-20" size={48} />
      <p className="font-bold">No Neural Activity Detected</p>
      <p className="text-sm">Contribute to the ecosystem to see your trail here.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {activities.map((act, i) => (
        <div key={i} className="p-4 bg-bg-secondary border border-border-color rounded-2xl flex items-center justify-between hover:border-primary/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${act.type === 'doubt' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {act.type === 'doubt' ? <Target size={20} /> : <MessageSquare size={20} />}
            </div>
            <div>
              <p className="font-bold text-text-primary text-sm group-hover:text-primary transition-colors">{act.title}</p>
              <p className="text-xs text-text-tertiary truncate max-w-sm">{act.subtitle}</p>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">{new Date(act.date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
