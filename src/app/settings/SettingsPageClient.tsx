'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, AlertTriangle, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

type ProfileFormData = {
  name: string;
  college: string;
  branch?: string;
  year?: number;
  bio?: string;
};

type PasswordFormData = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export default function SettingsPageClient() {
  const { user } = useAuth();
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const profileForm = useForm<ProfileFormData>();
  const passwordForm = useForm<PasswordFormData>();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      // 1. Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // 3. Update Profile Table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      alert('Avatar updated successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const onProfileSubmit = profileForm.handleSubmit(async (data) => {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) alert('Profile updated successfully');
    else alert('Failed to update profile');
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async (data) => {
    if (data.new_password !== data.confirm_password) {
      alert('Passwords do not match');
      return;
    }
    const res = await fetch('/api/user/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: data.current_password, new_password: data.new_password }),
    });
    if (res.ok) {
      alert('Password updated successfully');
      passwordForm.reset();
    } else {
      alert('Failed to update password');
    }
  });

  const handleDeleteAccount = async () => {
    const res = await fetch('/api/user', { method: 'DELETE' });
    if (res.ok) {
      router.push('/login?deleted=true');
    } else {
      alert('Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-6 text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-black text-white mb-8 font-heading tracking-tight">Settings</h1>

        {/* Profile Settings */}
        <div className="bg-white/5 dark:bg-[#13132b] rounded-3xl shadow-2xl p-8 border border-white/5 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-6 font-heading">Profile Settings</h2>
          <form onSubmit={onProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Avatar</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-300 overflow-hidden border-2 border-indigo-500/20">
                  {avatarUrl
                    ? <Image src={avatarUrl} alt="Avatar" width={80} height={80} />
                    : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-2xl text-white font-black uppercase">U</div>
                  }
                </div>
                <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-600/20">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload New'}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Full Name</label>
              <input {...profileForm.register('name', { required: true })} className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">College</label>
              <input {...profileForm.register('college', { required: true })} className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Branch</label>
                <input {...profileForm.register('branch')} className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Year</label>
                <input {...profileForm.register('year', { valueAsNumber: true })} type="number" min="1" max="5" className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Bio</label>
              <textarea {...profileForm.register('bio')} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
            </div>

            <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 text-sm font-bold">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white/5 dark:bg-[#13132b] rounded-3xl shadow-2xl p-8 border border-white/5 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-6 font-heading">Change Password</h2>
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Current Password</label>
              <input {...passwordForm.register('current_password', { required: true })} type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">New Password</label>
              <input {...passwordForm.register('new_password', { required: true, minLength: 8 })} type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Confirm Password</label>
              <input {...passwordForm.register('confirm_password', { required: true })} type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
            </div>
            <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 text-sm font-bold">
              <Save className="w-4 h-4" /> Update Password
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-white/5 dark:bg-[#13132b] rounded-3xl shadow-2xl p-8 border border-white/5 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-6 font-heading">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-gray-700 dark:text-gray-400 group-hover:text-white transition-colors">Email Notifications</span>
              <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="w-5 h-5 accent-indigo-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-gray-700 dark:text-gray-400 group-hover:text-white transition-colors">In-App Notifications</span>
              <input type="checkbox" checked={inAppNotifications} onChange={(e) => setInAppNotifications(e.target.checked)} className="w-5 h-5 accent-indigo-500" />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 shadow-2xl shadow-red-500/5">
          <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2 font-heading">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h2>
          <p className="text-red-600 dark:text-red-300 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-500 transition shadow-lg shadow-red-600/20 text-sm font-bold">Delete Account</button>
          ) : (
            <div className="space-y-2">
              <p className="text-red-700 dark:text-red-300 font-semibold">Are you absolutely sure?</p>
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-bold text-sm">Yes, delete my account</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg hover:text-white transition font-bold text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
