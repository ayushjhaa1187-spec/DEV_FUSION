'use client';

import { useEffect, useState } from 'react';
import ReputationBadge from '@/components/user/ReputationBadge';
import styles from './doubts.module.css';

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoubts() {
      try {
        const response = await fetch('/api/doubts');
        if (!response.ok) throw new Error('Failed to load doubts');
        const data = await response.json();
        setDoubts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDoubts();
  }, []);

  const [isAiSolving, setIsAiSolving] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');

  const handleAiSolve = async () => {

    if (!aiQuestion.trim()) return;
    setIsAiSolving(true);
    setAiResponse(null);
    try {
      const res = await fetch('/api/ai/doubt-solver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: aiQuestion, content: 'Conceptual help' }),
      });
      const data = await res.json();
      setAiResponse(data.solution);
    } catch (err) {
      setAiResponse('AI service temporary unavailable. Try again later.');
    } finally {
      setIsAiSolving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Doubt Feed</h1>
          <p className={styles.subtitle}>Ask questions, share knowledge, and earn reputation points.</p>
          
          <div className={`${styles.aiCard} glass`}>
            <div className={styles.aiHeader}>
              <span className={styles.aiBadge}>✨ AI ASSISTANT</span>
              <h3>Ask AI for an instant solution</h3>
            </div>
            <div className={styles.aiInputGroup}>
              <input 
                type="text" 
                placeholder="Describe your conceptual doubt..." 
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className={styles.aiInput}
              />
              <button 
                onClick={handleAiSolve}
                className={styles.aiBtn}
                disabled={isAiSolving}
              >
                {isAiSolving ? 'Solving...' : 'Solve with AI'}
              </button>
            </div>
            {aiResponse && (
              <div className={styles.aiSolution}>
                <p>{aiResponse}</p>
              </div>
            )}
          </div>
        </div>
        <button className={styles.askBtn}>Ask Community</button>
      </header>


      <div className={styles.filters}>
        <button className={`${styles.filterTab} ${styles.active}`}>Latest</button>
        <button className={styles.filterTab}>Trending</button>
        <button className={styles.filterTab}>Unanswered</button>
        <div className={styles.searchBar}>
          <input type="text" placeholder="Search doubts..." className={styles.searchInput} />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading community doubts...</div>
      ) : error ? (
        <div className={styles.errorBanner}>{error}</div>
      ) : (
        <div className={styles.doubtList}>
          {doubts.map((doubt) => (
            <div key={doubt.id} className={`${styles.doubtCard} glass`}>
              <div className={styles.voteSidebar}>
                <button className={styles.voteBtn}>▲</button>
                <span className={styles.voteCount}>{doubt.votes}</span>
                <button className={styles.voteBtn}>▼</button>
              </div>
              <div className={styles.cardMain}>
                <div className={styles.cardHeader}>
                  <div className={styles.tags}>
                    {doubt.subjects?.name && <span className={styles.tag}>{doubt.subjects.name}</span>}
                  </div>
                  {doubt.status === 'resolved' && <span className={styles.resolvedBadge}>✓ Resolved</span>}
                </div>
                <h3 className={styles.doubtTitle}>{doubt.title}</h3>
                <p className={styles.doubtSnippet}>{doubt.content}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.userInfo}>
                    {doubt.profiles?.avatar_url ? (
                      <img src={doubt.profiles.avatar_url} alt={doubt.profiles.username} className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarPlaceholder} />
                    )}
                    <div className={styles.userDetails}>
                      <span className={styles.userName}>{doubt.profiles?.username || 'Learner'}</span>
                      <ReputationBadge points={doubt.profiles?.reputation_points || 0} />
                    </div>
                  </div>

                  <div className={styles.meta}>
                    <span>Community Activity</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {doubts.length === 0 && <p className={styles.emptyState}>No doubts found. Be the first to ask!</p>}
        </div>
      )}
    </div>
  );
}

