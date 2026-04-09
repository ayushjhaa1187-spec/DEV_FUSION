'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Trophy, MessageSquare, Star, BookOpen } from 'lucide-react';
import ReputationBadge from '@/components/user/ReputationBadge';

const TIERS = [
  { name: 'Diamond', min: 1000, color: '#00f2ff', icon: '💎' },
  { name: 'Platinum', min: 500, color: '#e5e4e2', icon: '💍' },
  { name: 'Gold', min: 250, color: '#ffd700', icon: '🥇' },
  { name: 'Silver', min: 100, color: '#c0c0c0', icon: '🥈' },
  { name: 'Bronze', min: 0, color: '#cd7f32', icon: '🥉' },
];

const getTier = (points: number) => TIERS.find(t => points >= t.min) || TIERS[TIERS.length - 1];

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const [profile, setProfile] = useState<any>(null);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'doubts' | 'answers'>('doubts');

  useEffect(() => {
    if (!username) return;
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profile/${username}`);
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setProfile(data.profile);
        setDoubts(data.doubts || []);
        setAnswers(data.answers || []);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [username]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'white' }}>
      Loading...
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', color: 'white' }}>
      <h2>User not found</h2>
      <Link href="/leaderboard" style={{ color: 'var(--color-primary)' }}>View Leaderboard</Link>
    </div>
  );

  const tier = getTier(profile.reputation_points || 0);

  return (
    <main style={{ minHeight: '100vh', background: '#0f0f1a', color: 'white', paddingTop: 80 }}>
      {/* Profile Header */}
      <div style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '40px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}
          >
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                alt={username}
                style={{ width: 96, height: 96, borderRadius: 24, border: '3px solid rgba(99,102,241,0.5)', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', bottom: -8, right: -8, background: '#1e1e2e', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)', color: tier.color }}>
                {tier.icon} {tier.name}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 4px' }}>{profile.full_name || username}</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>@{username}</p>

              {profile.bio && <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16, maxWidth: 500 }}>{profile.bio}</p>}

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                {profile.college && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} /> {profile.college}
                  </span>
                )}
                {profile.branch && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BookOpen size={13} /> {profile.branch}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px 24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-primary)' }}>{profile.reputation_points || 0}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Reputation</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px 24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{doubts.length}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Doubts</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px 24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{answers.length}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Answers</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Tabs */}
      <div style={{ maxWidth: 900, margin: '32px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['doubts', 'answers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 24px',
                borderRadius: 12,
                border: 'none',
                background: activeTab === tab ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.9rem',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'doubts' ? <><MessageSquare size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{doubts.length} Doubts</> : <><Star size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{answers.length} Answers</>}
            </button>
          ))}
        </div>

        {/* Doubts Tab */}
        {activeTab === 'doubts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {doubts.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 48 }}>No doubts posted yet.</p>
            ) : doubts.map(d => (
              <Link key={d.id} href={`/doubts/${d.id}`} style={{ display: 'block', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 20px', textDecoration: 'none', transition: 'background 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    {d.status === 'resolved' && <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 6, padding: '2px 8px', marginBottom: 6, display: 'inline-block' }}>Resolved</span>}
                    <h3 style={{ color: 'white', fontWeight: 700, margin: '4px 0 6px', fontSize: '0.95rem' }}>{d.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>{d.subjects?.name || 'General'} · {new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', flexShrink: 0 }}>
                    <span>▲ {d.votes || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Answers Tab */}
        {activeTab === 'answers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {answers.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 48 }}>No answers posted yet.</p>
            ) : answers.map(a => (
              <Link key={a.id} href={`/doubts/${a.doubt_id}`} style={{ display: 'block', background: 'rgba(255,255,255,0.04)', border: `1px solid ${a.is_accepted ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: '16px 20px', textDecoration: 'none', transition: 'background 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    {a.is_accepted && <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 6, padding: '2px 8px', marginBottom: 6, display: 'inline-block' }}>✓ Accepted</span>}
                    <p style={{ color: 'rgba(255,255,255,0.75)', margin: '4px 0', fontSize: '0.9rem', lineHeight: 1.4 }}>{a.content?.slice(0, 160)}{a.content?.length > 160 ? '...' : ''}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', margin: '6px 0 0' }}>{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', flexShrink: 0 }}>
                    <span>▲ {a.votes || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
