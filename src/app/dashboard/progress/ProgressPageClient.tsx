'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';
import './progress.css';

export default function ProgressPageClient() {
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

  if (loading) return (
    <div className="sb-page progress-container animate-pulse">
      <div className="h-10 bg-white/5 rounded-xl w-64 mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="h-32 bg-white/5 rounded-2xl" />
        <div className="h-32 bg-white/5 rounded-2xl" />
        <div className="h-32 bg-white/5 rounded-2xl" />
      </div>
      <div className="h-64 bg-white/5 rounded-2xl" />
    </div>
  );

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
          <h2 className="text-xl font-bold">Subject Master History</h2>
          <Link href="/tests" className="sb-btnGhost">Take New Test</Link>
        </div>

        <div className="history-list">
          {history.length > 0 ? (
            <div className="table-responsive glass rounded-3xl overflow-hidden border border-white/5">
              <table className="history-table w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="p-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">Date</th>
                    <th className="p-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">Subject</th>
                    <th className="p-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">Score</th>
                    <th className="p-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => (
                    <tr key={i} className="history-row border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm font-bold">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-sm text-indigo-400 font-black tracking-tighter">{item.subjects?.name || 'General'}</td>
                      <td className="p-4">
                        <div className="score-wrap flex items-center gap-3">
                          <span className="score-num font-black">{item.score}%</span>
                          <div className="score-bar-bg flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="score-bar-fill h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${item.score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`status-pill px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.score >= 40 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {item.score >= 40 ? 'PASSED' : 'RETRY'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-history glass p-20 text-center rounded-[40px] border border-white/5">
              <p className="text-gray-500 font-medium">No test data available. Start your first AI-generated test to track progress!</p>
              <Link href="/tests" className="sb-btnPrimary mt-8 inline-block" style={{ marginTop: '16px' }}>Generate Test &rarr;</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
