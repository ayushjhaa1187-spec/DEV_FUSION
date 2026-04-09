'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';

import { Skeleton } from '@/components/ui/Skeleton';

function WeakAreasWidget() {
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/weak-areas').then(res => res.json()).then(setWeakAreas).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton width="100%" height="100px" rounded />;
  
  if (weakAreas.length === 0) return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px', textAlign: 'center' }}>
      <p style={{ margin: 0, opacity: 0.6 }}>Looking good! Keep taking tests to maintain mastery.</p>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
      {weakAreas.map(area => (
        <div key={area.id} className="glass" style={{ padding: '1.5rem', borderRadius: '24px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>{area.name}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '12px' }}>Avg Score: {area.avg}%</div>
          <Link href="/tests" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Review Concept →
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [hasStreakBadge, setHasStreakBadge] = useState(false);
  const supabase = createSupabaseBrowser();

  const cards = [
    { href: '/doubts', label: 'Doubt Feed', icon: '❓', desc: 'Browse and answer community doubts' },
    { href: '/mentors', label: 'Mentors', icon: '🎓', desc: 'Book a 30-min session' },
    { href: '/dashboard/sessions', label: 'My Sessions', icon: '📅', desc: 'Join your live meetings' },
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <Skeleton width="60%" height="2.5rem" className="mb-4" />
        <Skeleton width="40%" height="1.2rem" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {[1, 2, 3, 4].map(i => <Skeleton key={i} height="150px" className="rounded-xl" />)}
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem', color: 'var(--color-text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Welcome back, {profile?.full_name || user.email?.split('@')[0]} 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
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
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '8px' }}>Reputation Gallon</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{profile?.reputation_points || 0} <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.6 }}>PTS</span></div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '8px' }}>Tests Attempted</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{profile?.tests_taken || 0} <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.6 }}>QUIZZES</span></div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '8px' }}>Doubts Answered</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{profile?.doubts_answered || 0} <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.6 }}>SOLVED</span></div>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span> Academic Health Check
        </h2>
        <WeakAreasWidget />
      </div>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {cards.map(card => (
          <Link key={card.href} href={card.href} style={{
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '1.75rem', textDecoration: 'none', color: 'var(--color-text)',
            transition: 'border-color 0.2s, transform 0.2s',
          }}>
            <span style={{ fontSize: '1.75rem' }}>{card.icon}</span>
            <span style={{ fontWeight: 700 }}>{card.label}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{card.desc}</span>
          </Link>
        ))}
      </div>

      <button onClick={signOut} style={{
        padding: '0.65rem 1.5rem', background: 'transparent',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9999px',
        color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.9rem'
      }}>
        Sign out
      </button>
    </div>
  );
}
