'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
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
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile(data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          try {
            setLoading(true); // Ensure loading is true while fetching profile
            await fetchProfile(currentUser.id);
          } catch (e) {
            console.error("Profile fetch failed:", e);
          } finally {
            setLoading(false);
          }
        } else {
          setProfile(null);
          setLoading(false);
        }

        // Award daily login points when user signs in
        if (currentUser && (_event === 'SIGNED_IN' || _event === 'USER_UPDATED')) {
          try {
            await fetch('/api/auth/daily-login', { method: 'POST' });
          } catch (err) {
            // Non-blocking catch
          }
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchProfile(currentUser.id);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Perform global sign out to invalidate session on Supabase servers
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear local states
      setUser(null);
      setProfile(null);
      
      // Clear persistence - crucial for "loophole" fix
      localStorage.clear();
      sessionStorage.clear();
      
      // Hard redirect to home to reset environment
      window.location.replace('/');
    } catch (err) {
      console.error('Error signing out:', err);
      window.location.replace('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
