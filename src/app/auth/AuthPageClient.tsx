'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export default function AuthPageClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowser();
  const { showToast } = useToast();

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      if (err === 'auth-failed') {
        showToast('Authentication failed. Please try again.', 'error');
      } else if (err.includes('provider') || err.includes('not_enabled') || err.includes('unsupported')) {
        showToast('Google sign-in is not configured yet. Please use email & password.', 'warning');
      } else {
        showToast(err, 'error');
      }
    }
  }, [searchParams, showToast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          },
        });
        if (error) throw error;
        showToast('Check your email for the confirmation link.', 'info');
        return;
      }
      
      // Attempt login streak tracking on successful login
      await supabase.rpc('process_login_streak', { p_user_id: (await supabase.auth.getUser()).data.user?.id });
      
      router.push('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.message?.includes('provider') || err.message?.includes('not enabled') || err.message?.includes('unsupported')) {
        showToast('Google sign-in is not enabled in your Supabase Dashboard.', 'error');
      } else {
        showToast(err.message || 'Google Auth failed', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card variant="elevated" className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
            {isLogin ? 'Welcome Back' : 'Join SkillBridge'}
          </h1>
          <p className="text-text-secondary">
            {isLogin ? 'Access your peer learning network' : 'Start your journey today'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <FormInput
              id="name"
              label="Full Name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}

          <FormInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="you@college.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <div className="space-y-1">
            <FormInput
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) return showToast('Enter your email first', 'warning');
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/auth/reset-password`,
                    });
                    if (error) showToast(error.message, 'error');
                    else showToast('Password reset link sent to your email.', 'success');
                  }}
                  className="text-xs font-semibold text-primary hover:text-text-primary transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" loading={loading}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-border-color flex-1"></div>
          <span className="text-xs text-text-secondary font-medium uppercase tracking-widest">Or</span>
          <div className="h-px bg-border-color flex-1"></div>
        </div>

        <Button
          onClick={handleGoogle}
          variant="secondary"
          size="lg"
          className="w-full flex items-center justify-center gap-3 bg-bg-secondary hover:bg-bg-tertiary"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          }
        >
          Continue with Google
        </Button>

        <p className="mt-8 text-center text-sm text-text-secondary">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-text-primary hover:text-primary transition-colors underline-offset-4 hover:underline"
            type="button"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </Card>
    </div>
  );
}
