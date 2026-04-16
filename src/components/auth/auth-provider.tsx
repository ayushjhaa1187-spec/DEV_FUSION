'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  plan?: string | 'free';
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const fetchProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Profile fetch error:', error);
      }

      if (data) {
        // Fetch plan separately for reliability
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', authUser.id)
          .eq('status', 'active')
          .maybeSingle();

        setProfile({ ...(data as Profile), plan: sub?.plan ?? 'free' });
        return;
      }

      // Upsert only if profile missing
      await supabase.from('profiles').upsert(
        {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      ).catch(e => console.warn('[Auth] Upsert failed:', e));

      setProfile({ id: authUser.id, plan: 'free' } as Profile);
    } catch (err) {
      console.error('[Auth] Critical sync error:', err);
      // Fallback to minimal profile but DON'T block loading complete
      setProfile({ id: authUser.id, plan: 'free' } as Profile);
    }
  };

  // ABSOLUTE UNBLOCKER: Guarantee the UI is interactive within 2s of mount.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('[AuthProvider] Emergency unblock triggered.');
        setLoading(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log(`[Auth] Event Detected: ${event}`);

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
        router.replace('/');
        router.refresh();
        return;
      }

      if (currentUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
        try {
          await fetchProfile(currentUser);
          if (event === 'SIGNED_IN') {
             fetch('/api/auth/daily-login', { method: 'POST' }).catch(() => {});
          }
        } catch (e) {
          console.error('[Auth] Data sync failure:', e);
        } finally {
          if (mounted) setLoading(false);
        }
      } else if (!currentUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signOut = async () => {
    try {
      setLoading(true);
      // Clear Supabase session
      await supabase.auth.signOut({ scope: 'global' });
      
      // Explicitly clear any remaining auth-related storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        // Clear cookies that might be lingering
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }

      setUser(null);
      setProfile(null);
      
      // Force immediate navigation and refresh
      router.replace('/');
      router.refresh();
    } catch (err) {
      console.error('Error signing out:', err);
      setUser(null);
      setProfile(null);
      router.replace('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return <AuthContext.Provider value={{ user, profile, loading, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
