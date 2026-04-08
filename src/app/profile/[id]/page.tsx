'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import ReputationBadge from '@/components/reputation/ReputationBadge';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [contributionStats, setContributionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function loadProfile() {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (p) {
        setProfile(p);
        
        // Load badges
        const { data: b } = await supabase
          .from('user_badges')
          .select('badges(*)')
          .eq('user_id', id);
        setBadges(b?.map(item => item.badges) || []);

        // Load stats
        const { count: doubtCount } = await supabase
          .from('doubts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', id);
        
        const { count: answerCount } = await supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', id);

        setContributionStats({ doubts: doubtCount, answers: answerCount });
      }
      setLoading(false);
    }
    loadProfile();
  }, [id]);

  if (loading) return <div className="sb-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading profile...</div>;
  if (!profile) return <div className="sb-page">Profile not found.</div>;

  return (
    <main className="sb-page">
      <Navbar />
      <div className="profile-container" style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        <div className="profile-header glass" style={{ padding: '40px', borderRadius: '24px', display: 'flex', gap: '30px', alignItems: 'center' }}>
          <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}`} alt={profile.username} style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--primary)' }} />
          <div className="profile-info">
            <h1 className="sb-title" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>@{profile.username}</h1>
            <p className="sb-subtitle" style={{ marginBottom: '15px' }}>{profile.full_name} • {profile.college}</p>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <ReputationBadge points={profile.reputation_points} />
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginTop: '30px' }}>
          <aside className="profile-sidebar">
            <div className="glass" style={{ padding: '24px', borderRadius: '20px', marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '20px' }}>Contribution Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Doubts Asked</span>
                  <span style={{ fontWeight: 700 }}>{contributionStats?.doubts}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Solutions Provided</span>
                  <span style={{ fontWeight: 700 }}>{contributionStats?.answers}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Active Streak</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{profile.login_streak} days 🔥</span>
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
              <h3 style={{ marginBottom: '20px' }}>Skills & Socials</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {profile.branch && <span className="sb-badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>{profile.branch}</span>}
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                {profile.github_url && <a href={profile.github_url} target="_blank" className="sb-btnGhost" style={{ padding: '8px' }}>GitHub</a>}
                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" className="sb-btnGhost" style={{ padding: '8px' }}>LinkedIn</a>}
              </div>
            </div>
          </aside>

          <section className="profile-main">
            <div className="glass" style={{ padding: '30px', borderRadius: '24px', minHeight: '400px' }}>
              <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🏅</span> Achievements & Badges
              </h3>
              {badges.length > 0 ? (
                <div className="badge-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
                  {badges.map((badge: any) => (
                    <div key={badge.id} className="badge-item" style={{ textAlign: 'center', padding: '15px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{badge.icon}</div>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '4px' }}>{badge.name}</h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.2 }}>{badge.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                  This user hasn't earned any badges yet. Participate in the community to unlock!
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
