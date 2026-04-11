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

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    branch: '',
    semester: '',
    bio: '',
    github: '',
    linkedin: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
          social_links,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      showToast('Profile setup complete! Welcome aboard.', 'success');
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
           <CardTitle>Complete Your Profile</CardTitle>
           <CardDescription>Tell us a bit about your academic journey to personalize your SkillBridge experience.</CardDescription>
         </CardHeader>
         <CardContent>
           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  id="college"
                  label="College / University"
                  placeholder="e.g. Stanford University"
                  value={formData.college}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  id="branch"
                  label="Branch / Major"
                  placeholder="e.g. Computer Science"
                  value={formData.branch}
                  onChange={handleChange}
                  required
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
                  required
                />
                <FormInput
                  id="linkedin"
                  label="LinkedIn Profile"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedin}
                  onChange={handleChange}
                />
             </div>
             
             <FormInput
                id="github"
                label="GitHub Profile"
                placeholder="https://github.com/..."
                value={formData.github}
                onChange={handleChange}
             />

             <FormTextarea
                id="bio"
                label="Mini Bio"
                placeholder="Passionate about AI and full-stack development..."
                value={formData.bio}
                onChange={handleChange}
                helperText="A short description about yourself. (Optional)"
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
