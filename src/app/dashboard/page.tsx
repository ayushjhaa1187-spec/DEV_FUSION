'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [hasStreakBadge, setHasStreakBadge] = useState(false);
  const supabase = createSupabaseBrowser();

  const cards = [
    { href: '/doubts', label: 'Doubt Feed', icon: '❓', desc: 'Browse and answer community doubts' },
    { href: '/mentors', label: 'Mentors', icon: '🎓', desc: 'Book a 30-min session' },
    { href: '/tests', label: 'Practice Tests', icon: '📝', desc: 'AI-generated MCQ quizzes' },
    { href: '/profile', label: 'My Profile', icon: '👤', desc: 'View reputation and badges' },
  ];

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({data}: {data: any}) => setProfile(data));
      supabase.from('user_badges').select('badges(name)').eq('user_id', user.id).then(({data}: {data: any[] | null}) => {
        const found = data?.some((b: any) => b.badges.name === 'Streak Master');
        setHasStreakBadge(!!found);
      });
    }
  }, [user, loading, router, supabase]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
      Loading your dashboard...
    </div>
  );

  if (!user) return null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem', color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Welcome back, {profile?.full_name || user.email?.split('@')[0]} 👋
          </h1>
          <p style={{ color: 'var(--muted)' }}>{user.email}</p>
        </div>
        
        {profile && (
          <div className="streak-widget glass" style={{ padding: '15px 25px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{profile.login_streak >= 7 ? '🔥' : '⚡'}</div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f59e0b' }}>{profile.login_streak} Day Streak</div>
            {hasStreakBadge && <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, color: '#f59e0b', marginTop: '4px' }}>Streak Master</div>}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {cards.map(card => (
          <Link key={card.href} href={card.href} style={{
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '1.75rem', textDecoration: 'none', color: 'var(--text)',
            transition: 'border-color 0.2s, transform 0.2s',
          }}>
            <span style={{ fontSize: '1.75rem' }}>{card.icon}</span>
            <span style={{ fontWeight: 700 }}>{card.label}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{card.desc}</span>
          </Link>
        ))}
      </div>

      <button onClick={signOut} style={{
        padding: '0.65rem 1.5rem', background: 'transparent',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9999px',
        color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem'
      }}>
        Sign out
      </button>
    </div>
  );
}
