'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import ReputationBadge from '@/components/user/ReputationBadge';
import styles from './doubt-detail.module.css';

export default function DoubtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const [doubt, setDoubt] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { id } = await params;
      try {
        const doubtRes = await fetch(`/api/doubts/${id}`);
        const answersRes = await fetch(`/api/doubts/${id}/answers`);
        
        if (doubtRes.ok) setDoubt(await doubtRes.json());
        if (answersRes.ok) setAnswers(await answersRes.json());
      } catch (err) {
        console.error('Failed to load doubt details');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params]);

  const handlePostAnswer = async () => {
    if (!newAnswer.trim()) return;
    setPosting(true);
    const { id } = await params;

    try {
      const res = await fetch(`/api/doubts/${id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newAnswer }),
      });

      if (res.ok) {
        const answer = await res.json();
        setAnswers([...answers, answer]);
        setNewAnswer('');
      }
    } catch (err) {
      alert('Failed to post answer');
    } finally {
      setPosting(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      const res = await fetch(`/api/answers/${answerId}/accept`, {
        method: 'POST',
      });

      if (res.ok) {
        setAnswers(answers.map(a => 
          a.id === answerId ? { ...a, is_accepted: true } : { ...a, is_accepted: false }
        ));
      }
    } catch (err) {
      alert('Failed to accept solution');
    }
  };

  if (loading) return <div className={styles.loading}>Loading discussion...</div>;
  if (!doubt) return <div className={styles.errorBanner}>Doubt not found or was deleted.</div>;

  return (
    <div className={styles.container}>
      <article className={`${styles.mainDoubt} glass`}>
        <header className={styles.header}>
          <div className={styles.tags}>
            {doubt.subjects?.name && <span className={styles.tag}>{doubt.subjects.name}</span>}
          </div>
          <h1 className={styles.title}>{doubt.title}</h1>
          <div className={styles.meta}>
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
            <span className={styles.date}>Asked {new Date(doubt.created_at).toLocaleDateString()}</span>
          </div>
        </header>
        <div className={styles.content}>
          <p>{doubt.content}</p>
        </div>
        <footer className={styles.footer}>
          <div className={styles.actions}>
            <button className={styles.voteBtn}>▲</button>
            <span className={styles.voteCount}>{doubt.votes}</span>
            <button className={styles.voteBtn}>▼</button>
          </div>
          <button className={styles.shareBtn}>Share</button>
        </footer>
      </article>

      <section className={styles.answersSection}>
        <h2 className={styles.sectionTitle}>{answers.length} Answers</h2>
        <div className={styles.answerList}>
          {answers.map(answer => (
            <div key={answer.id} className={`${styles.answerCard} glass ${answer.is_accepted ? styles.accepted : ''}`}>
              {answer.is_accepted && <div className={styles.acceptedBadge}>✓ Accepted Solution</div>}
              <div className={styles.answerHeader}>
                <div className={styles.userInfo}>
                  <div className={styles.avatarPlaceholder} />
                  <div className={styles.userDetails}>
                    <span className={styles.userName}>{answer.profiles?.username || 'Solver'}</span>
                    <ReputationBadge points={answer.profiles?.reputation_points || 0} />
                  </div>
                </div>
                <span className={styles.date}>{new Date(answer.created_at).toLocaleDateString()}</span>
              </div>
              <div className={styles.answerContent}>
                <p>{answer.content}</p>
              </div>
              <div className={styles.answerFooter}>
                <div className={styles.actions}>
                  <button className={styles.voteBtn}>▲</button>
                  <span className={styles.voteCount}>{answer.votes}</span>
                  <button className={styles.voteBtn}>▼</button>
                </div>
                
                {user?.id === doubt.author_id && !answer.is_accepted && (
                  <button 
                    onClick={() => handleAcceptAnswer(answer.id)}
                    className={styles.acceptBtn}
                  >
                    Accept as Solution
                  </button>
                )}
              </div>
            </div>
          ))}
          {answers.length === 0 && <p className={styles.emptyState}>No answers yet. Be the first to help!</p>}
        </div>
      </section>

      {user ? (
        <section className={`${styles.postAnswer} glass`}>
          <h3>Your Answer</h3>
          <textarea 
            className={styles.textarea} 
            placeholder="Write your solution here... (earn +10 reputation)"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
          ></textarea>
          <button 
            className={styles.postBtn} 
            onClick={handlePostAnswer}
            disabled={posting}
          >
            {posting ? 'Posting...' : 'Post Answer'}
          </button>
        </section>
      ) : (
        <section className={`${styles.authNotice} glass`}>
          <p>Please <a href="/auth">log in</a> to contribute to this discussion.</p>
        </section>
      )}
    </div>
  );
}

