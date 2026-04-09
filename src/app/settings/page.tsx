'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, AlertTriangle, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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

export default function SettingsPage() {
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
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      setAvatarUrl(data.secure_url);

      await fetch('/api/user/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: data.secure_url }),
      });
    } catch (err) {
      alert('Failed to upload avatar');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>

        {/* Profile Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Settings</h2>
          <form onSubmit={onProfileSubmit} className="space-y-4">
            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avatar</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-300 overflow-hidden">
                  {avatarUrl
                    ? <Image src={avatarUrl} alt="Avatar" width={80} height={80} />
                    : <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-2xl text-white">U</div>
                  }
                </div>
                <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload New'}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input {...profileForm.register('name', { required: true })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">College</label>
              <input {...profileForm.register('college', { required: true })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                <input {...profileForm.register('branch')} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                <input {...profileForm.register('year', { valueAsNumber: true })} type="number" min="1" max="5" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
              <textarea {...profileForm.register('bio')} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>

            <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <input {...passwordForm.register('current_password', { required: true })} type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input {...passwordForm.register('new_password', { required: true, minLength: 8 })} type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
              <input {...passwordForm.register('confirm_password', { required: true })} type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              <Save className="w-4 h-4" /> Update Password
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
              <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="w-5 h-5" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">In-App Notifications</span>
              <input type="checkbox" checked={inAppNotifications} onChange={(e) => setInAppNotifications(e.target.checked)} className="w-5 h-5" />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h2>
          <p className="text-red-600 dark:text-red-300 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">Delete Account</button>
          ) : (
            <div className="space-y-2">
              <p className="text-red-700 dark:text-red-300 font-semibold">Are you absolutely sure?</p>
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition">Yes, delete my account</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
