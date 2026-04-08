'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';
import './progress.css';

export default function ProgressPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/tests/history');
        const data = await res.json();
        setHistory(data || []);
      } catch (err) {
        console.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchHistory();
  }, [user]);

  const avgScore = history.length > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.score || 0), 0) / history.length) 
    : 0;

  if (loading) return <div className="sb-page progress-container"><div className="sb-loading">syncing your academic growth...</div></div>;

  return (
    <div className="sb-page progress-container">
      <header className="progress-header sb-stagger-1">
        <h1 className="sb-title">Your <span>Academic Growth</span></h1>
        <p className="sb-subtitle">Track your performance across AI-generated tests and identify subjects that need more focus.</p>
      </header>

      <div className="stats-board sb-stagger-2">
        <div className="board-card glass">
          <span className="board-label">Avg. Proficiency</span>
          <div className="board-value">{avgScore}%</div>
          <div className="board-trend up">+12% from last week</div>
        </div>
        <div className="board-card glass">
          <span className="board-label">Tests Completed</span>
          <div className="board-value">{history.length}</div>
          <div className="board-trend">Keep it up!</div>
        </div>
        <div className="board-card glass">
          <span className="board-label">Reputation Points</span>
          <div className="board-value gold">{user?.user_metadata?.reputation_points || 0}</div>
          <div className="board-trend">Rank: Scholar</div>
        </div>
      </div>

      <section className="history-section sb-stagger-3">
        <div className="section-head">
          <h2>Subject Master History</h2>
          <Link href="/tests" className="sb-btnGhost">Take New Test</Link>
        </div>

        <div className="history-list">
          {history.length > 0 ? (
            <div className="table-responsive glass">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => (
                    <tr key={i} className="history-row">
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td>{item.subjects?.name || 'General'}</td>
                      <td>
                        <div className="score-wrap">
                          <span className="score-num">{item.score}%</span>
                          <div className="score-bar-bg">
                            <div className="score-bar-fill" style={{ width: `${item.score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${item.score >= 40 ? 'pass' : 'fail'}`}>
                          {item.score >= 40 ? 'PASSED' : 'RETRY'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-history glass">
              <p>No test data available. Start your first AI-generated test to track progress!</p>
              <Link href="/tests" className="sb-btnPrimary" style={{ marginTop: '16px' }}>Generate Test &rarr;</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
