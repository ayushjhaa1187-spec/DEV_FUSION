'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormInput, FormTextarea } from '@/components/ui/FormInput';
import { useToast } from '@/components/ui/Toast';

export default function OnboardingClient({ user, subjects }: { user: any, subjects: any[] }) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const { showToast } = useToast();
  const role = user?.user_metadata?.role || 'student';
  const isOrg = role === 'organization';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    branch: '',
    semester: '',
    bio: '',
    github: '',
    linkedin: '',
    // Org specific
    website: '',
    slug: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
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
            full_name: user?.user_metadata?.full_name || formData.college, // use college field as name if needed
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
        const social_links = {
          github: formData.github,
          linkedin: formData.linkedin,
        };

        const { error } = await supabase
          .from('profiles')
          .update({
            college: formData.college,
            branch: formData.branch,
            semester: parseInt(formData.semester) || 1,
            bio: formData.bio,
            github_url: formData.github,
            linkedin_url: formData.linkedin,
          })
          .eq('id', user.id);

        if (error) throw error;
      }
      
      showToast('Account setup complete! Welcome aboard.', 'success');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-main flex items-center justify-center p-4">
       <Card variant="elevated" className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>{isOrg ? 'Organization Setup' : 'Complete Your Profile'}</CardTitle>
            <CardDescription>
              {isOrg 
                ? 'Tell us about your organization to help mentors find and join you.' 
                : 'Tell us a bit about your academic journey to personalize your SkillBridge experience.'}
            </CardDescription>
          </CardHeader>
         <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isOrg ? (
                  <>
                    <FormInput
                      id="college"
                      label="Public Name"
                      placeholder="e.g. Acme Coding Club"
                      value={formData.college}
                      onChange={handleChange}
                      required
                    />
                    <FormInput
                      id="slug"
                      label="Profile ID (Slug)"
                      placeholder="e.g. acme-club"
                      value={formData.slug}
                      onChange={handleChange}
                      required
                    />
                    <FormInput
                      id="website"
                      label="Website URL"
                      placeholder="https://acme.org"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </>
                ) : (
                  <>
                    <FormInput
                      id="college"
                      label="College / University"
                      placeholder="e.g. Stanford University"
                      value={formData.college}
                      onChange={handleChange}
                      required={!isOrg}
                    />
                    <FormInput
                      id="branch"
                      label="Branch / Major"
                      placeholder="e.g. Computer Science"
                      value={formData.branch}
                      onChange={handleChange}
                      required={!isOrg}
                    />
                    <FormInput
                      id="semester"
                      label="Current Semester"
                      type="number"
                      min="1"
                      max="10"
                      placeholder="e.g. 5"
                      value={formData.semester}
                      onChange={handleChange}
                      required={!isOrg}
                    />
                    <FormInput
                      id="linkedin"
                      label="LinkedIn Profile"
                      placeholder="https://linkedin.com/in/..."
                      value={formData.linkedin}
                      onChange={handleChange}
                    />
                  </>
                )}
              </div>
              
              {!isOrg && (
                <FormInput
                  id="github"
                  label="GitHub Profile"
                  placeholder="https://github.com/..."
                  value={formData.github}
                  onChange={handleChange}
                />
              )}

              <FormTextarea
                id="bio"
                label={isOrg ? "Organization Description" : "Mini Bio"}
                placeholder={isOrg ? "We are a community of developers dedicated to..." : "Passionate about AI and full-stack development..."}
                value={formData.bio}
                onChange={handleChange}
                helperText={isOrg ? "Tell potential mentors what you're all about." : "A short description about yourself. (Optional)"}
              />

             <div className="pt-4 flex justify-end">
               <Button type="submit" variant="primary" size="lg" loading={loading}>
                 Save & Continue
               </Button>
             </div>
           </form>
         </CardContent>
       </Card>
    </div>
  );
}
