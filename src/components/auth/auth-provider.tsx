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

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, role')
      .eq('id', uid)
      .single();

    if (error) {
      throw error;
    }

    setProfile(data as Profile);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
        router.replace('/');
        router.refresh();
        return;
      }

      if (currentUser) {
        try {
          setLoading(true);
          await fetchProfile(currentUser.id);
        } catch (e) {
          console.error('Profile fetch failed:', e);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }

      if (currentUser && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        try {
          await fetch('/api/auth/daily-login', { method: 'POST' });
        } catch {
          // intentionally ignored
        }
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchProfile(currentUser.id);
        } catch (e) {
          console.error('Profile preload failed:', e);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    setUser(null);
    setProfile(null);
    router.replace('/');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
