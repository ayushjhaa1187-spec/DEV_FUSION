'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    branch: '',
    semester: '',
    bio: '',
    github_url: '',
    linkedin_url: ''
  });

  const branches = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Other'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          username: user.email?.split('@')[0], // Default username
          full_name: user.user_metadata.full_name || user.email?.split('@')[0]
        });

      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#13132b] border border-white/5 p-12 rounded-[40px] shadow-2xl"
        >
          <header className="mb-12">
            <h1 className="text-4xl font-black mb-3">Complete Your Profile</h1>
            <p className="text-gray-400">Join the community to start learning and earning reputation.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-indigo-500 tracking-widest">College</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Stanford University"
                  className="w-full bg-[#0d0d1a] border border-white/10 rounded-2xl py-4 px-6 focus:border-indigo-500 outline-none transition-all"
                  value={formData.college}
                  onChange={e => setFormData({...formData, college: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-indigo-500 tracking-widest">Branch</label>
                <select 
                  required
                  className="w-full bg-[#0d0d1a] border border-white/10 rounded-2xl py-4 px-6 focus:border-indigo-500 outline-none transition-all"
                  value={formData.branch}
                  onChange={e => setFormData({...formData, branch: e.target.value})}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-indigo-500 tracking-widest">About You</label>
              <textarea 
                placeholder="Talk about your interests, skills or what you want to learn..."
                className="w-full h-32 bg-[#0d0d1a] border border-white/10 rounded-2xl py-4 px-6 focus:border-indigo-500 outline-none transition-all resize-none"
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                <label className="text-xs font-black uppercase text-indigo-500 tracking-widest">Semester</label>
                <select 
                  required
                  className="w-full bg-[#0d0d1a] border border-white/10 rounded-2xl py-4 px-6 focus:border-indigo-500 outline-none transition-all"
                  value={formData.semester}
                  onChange={e => setFormData({...formData, semester: e.target.value})}
                >
                  <option value="">Select Semester</option>
                  {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-indigo-500 tracking-widest">LinkedIn URL</label>
                <input 
                  type="url" 
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-[#0d0d1a] border border-white/10 rounded-2xl py-4 px-6 focus:border-indigo-500 outline-none transition-all"
                  value={formData.linkedin_url}
                  onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Finalizing...' : 'Complete Registration'}
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
