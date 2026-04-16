'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormInput, FormTextarea } from '@/components/ui/FormInput';
import { useToast } from '@/components/ui/Toast';

import Gateway from '@/components/auth/Gateway';

export default function OnboardingClient({ user, profile, subjects }: { user: any, profile: any, subjects: any[] }) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const { showToast } = useToast();
  
  // 1. Permanent Initial Role
  const initialRole = (profile?.role || user?.user_metadata?.role) as 'student' | 'mentor' | 'organization' | undefined;
  
  // 2. Stable State Initialization
  const [selectedRole, setSelectedRole] = useState<'student' | 'mentor' | 'organization' | undefined>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skillbridge_setup_role');
      if (saved) return saved as any;
    }
    return initialRole;
  });

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    branch: '',
    semester: '',
    bio: '',
    github: '',
    linkedin: '',
    job_title: '',
    company: '',
    years_experience: '',
    expertise: '',
    website: '',
    slug: ''
  });

  const handleRoleSelect = async (role: 'student' | 'mentor' | 'organization') => {
    setSelectedRole(role);
    localStorage.setItem('skillbridge_setup_role', role);
    // Persist to DB immediately
    await supabase.from('profiles').update({ role }).eq('id', user.id);
  };

  const isMentor = selectedRole === 'mentor';
  const isOrg = selectedRole === 'organization';
  const isStudent = selectedRole === 'student';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isOrg) {
        // 1. Update Profile (Base)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            bio: formData.bio,
            website_url: formData.website,
            full_name: user?.user_metadata?.full_name || formData.college,
          })
          .eq('id', user.id);

        if (profileError) throw profileError;

        // 2. Create Organization record
        const { error: orgError } = await supabase
          .from('organizations')
          .insert({
            id: user.id,
            name: user?.user_metadata?.full_name || formData.college,
            slug: formData.slug || (user?.user_metadata?.full_name || formData.college).toLowerCase().replace(/\s+/g, '-'),
            description: formData.bio,
            website: formData.website,
            owner_id: user.id
          });

        if (orgError) throw orgError;

      } else {
        const { error } = await supabase
          .from('profiles')
          .update({
            college: formData.college || formData.company,
            branch: formData.branch || formData.expertise,
            semester: parseInt(formData.semester || formData.years_experience) || 1, 
            bio: formData.bio,
            github_url: formData.github,
            linkedin_url: formData.linkedin,
          })
          .eq('id', user.id);

        if (error) throw error;

        if (isMentor) {
          try {
            await supabase
              .from('mentor_profiles')
              .upsert({
                id: user.id,
                job_title: formData.job_title,
                company: formData.company,
                years_experience: parseInt(formData.years_experience) || 0,
                expertise: formData.expertise,
                specialty: formData.expertise,
                bio: formData.bio,
                hourly_rate: 500,
                rating: 5.0
              });
          } catch (mentorErr) {
            console.warn('[Onboarding] Mentor profile sync failed:', mentorErr);
          }
        }
      }
      
      localStorage.removeItem('skillbridge_setup_role');
      showToast('Account setup complete! Welcome aboard.', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <Gateway onSelect={handleRoleSelect} />
      </div>
    );
  }

  return (
    <div className="min-h-screen app-main flex items-center justify-center p-4">
       <Card variant="elevated" className="w-full max-w-2xl bg-[#0d091a] border-white/5">
          <CardHeader>
            <CardTitle className="text-white">
              {isOrg ? 'Organization Command Center' : isMentor ? 'Elite Mentor Profile' : 'Student Success Path'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {isOrg 
                ? 'Configure your organization identity to start hosting and scaling.' 
                : isMentor
                  ? 'Showcase your expertise to the next generation of engineers.'
                  : 'Tell us a bit about your academic journey to personalize your dashboard.'}
            </CardDescription>
          </CardHeader>
         <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                {isOrg ? (
                  <>
                    <FormInput
                      id="college"
                      label="Public Name"
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="e.g. Acme Coding Club"
                      value={formData.college}
                      onChange={handleChange}
                      required
                    />
                    <FormInput
                      id="slug"
                      label="Profile ID (Slug)"
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="e.g. acme-club"
                      value={formData.slug}
                      onChange={handleChange}
                      required
                    />
                    <FormInput
                      id="website"
                      label="Website URL"
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="https://acme.org"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </>
                ) : isMentor ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        id="job_title"
                        label="Current Profession"
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g. Senior Software Engineer"
                        value={formData.job_title}
                        onChange={handleChange}
                        required
                      />
                      <FormInput
                        id="company"
                        label="Organization / Company"
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g. Google / Freelance"
                        value={formData.company}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        id="years_experience"
                        label="Years of Experience"
                        className="bg-white/5 border-white/10 text-white"
                        type="number"
                        placeholder="e.g. 5"
                        value={formData.years_experience}
                        onChange={handleChange}
                        required
                      />
                      <FormInput
                        id="expertise"
                        label="Primary Expertise"
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g. React, Python, ML"
                        value={formData.expertise}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </>
                ) : isStudent ? (
                  <>
                    <FormInput
                      id="college"
                      label="College / University"
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="e.g. Stanford University"
                      value={formData.college}
                      onChange={handleChange}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        id="branch"
                        label="Branch / Major"
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g. Computer Science"
                        value={formData.branch}
                        onChange={handleChange}
                        required
                      />
                      <FormInput
                        id="semester"
                        label="Current Semester"
                        className="bg-white/5 border-white/10 text-white"
                        type="number"
                        min="1"
                        max="10"
                        placeholder="e.g. 5"
                        value={formData.semester}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </>
                ) : null}
              </div>
              
              {!isOrg && (
                <FormInput
                  id="github"
                  label="GitHub Profile"
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="https://github.com/..."
                  value={formData.github}
                  onChange={handleChange}
                />
              )}

              <FormTextarea
                id="bio"
                label={isOrg ? "Organization Description" : "Mini Bio"}
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                placeholder={isOrg ? "We are a community of developers dedicated to..." : "Passionate about AI and full-stack development..."}
                value={formData.bio}
                onChange={handleChange}
                helperText={isOrg ? "Tell potential mentors what you're all about." : "A short description about yourself. (Optional)"}
              />

             <div className="pt-4 flex justify-end gap-3">
               <Button 
                 type="button" 
                 variant="outline" 
                 onClick={() => {
                   setSelectedRole(undefined);
                   localStorage.removeItem('skillbridge_setup_role');
                 }}
                 disabled={loading}
                 className="border-white/10 text-gray-400"
               >
                 Back
               </Button>
               <Button type="submit" variant="primary" size="lg" loading={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black tracking-widest uppercase">
                 Complete Setup
               </Button>
             </div>
            </form>
         </CardContent>
       </Card>
    </div>
  );
}
