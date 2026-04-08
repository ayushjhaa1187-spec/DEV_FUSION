'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ReputationBadge from '@/components/user/ReputationBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaders() {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        setLeaders(data);
      } catch (err) {
        console.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    loadLeaders();
  }, []);

  return (
    <main className="sb-page">
      <Navbar />
      <div className="leaderboard-container" style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px' }}>
        <div className="header sb-stagger-1" style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 className="sb-title">Campus <span>Leaderboard</span></h1>
          <p className="sb-subtitle">Top contributors bridging the skill gap across all branches.</p>
        </div>

        <div className="leaders-list glass sb-stagger-2" style={{ borderRadius: '24px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '20px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ display: 'flex', gap: '20px', padding: '20px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <Skeleton width="40px" height="40px" rounded />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="40%" height="1rem" className="mb-2" />
                    <Skeleton width="20%" height="0.8rem" />
                  </div>
                  <Skeleton width="60px" height="20px" rounded />
                </div>
              ))}
            </div>
          ) : leaders.length > 0 ? (
            <>
              <div className="list-header" style={{ display: 'grid', gridTemplateColumns: '60px 1fr 140px 140px', padding: '15px 30px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--color-border)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>
                <span>Rank</span>
                <span>Student</span>
                <span style={{ textAlign: 'center' }}>Streak</span>
                <span style={{ textAlign: 'right' }}>Reputation</span>
              </div>
              {leaders.map((student: any, i: number) => (
                <Link 
                  key={student.id} 
                  href={`/profile/${student.id}`}
                  className="leader-row"
                  style={{ display: 'grid', gridTemplateColumns: '60px 1fr 140px 140px', padding: '20px 30px', alignItems: 'center', borderBottom: i < leaders.length - 1 ? '1px solid var(--color-border)' : 'none', textDecoration: 'none', color: 'inherit', transition: 'background 0.2s' }}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: i < 3 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                    #{i + 1}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={student.avatar_url || `https://ui-avatars.com/api/?name=${student.username}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-2)' }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{student.username}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{student.college}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontWeight: 600, color: '#f59e0b' }}>
                    {student.login_streak} 🔥
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <ReputationBadge points={student.reputation_points} />
                  </div>
                </Link>
              ))}
            </>
          ) : (
            <EmptyState 
              icon="🏆" 
              title="Leaderboard is empty" 
              description="Earn reputation by answering doubts and taking tests to appear here." 
            />
          )}
        </div>
      </div>
      <Footer />
      <style jsx>{`
        .leader-row:hover {
          background: rgba(255,255,255,0.03);
        }
      `}</style>
    </main>
  );
}
