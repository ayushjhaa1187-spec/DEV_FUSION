'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { doubtApi, answerApi } from '@/lib/api';
import ReputationBadge from '@/components/user/ReputationBadge';
import styles from './doubt-detail.module.css';

export default function DoubtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const { id } = use(params);
  const [doubt, setDoubt] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const doubtData = await doubtApi.getDoubt(id);
        const answersData = await answerApi.getAnswers(id);
        
        setDoubt(doubtData);
        setAnswers(answersData);
      } catch (err) {
        console.error('Failed to load doubt details');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handlePostAnswer = async () => {
    if (!newAnswer.trim()) return;
    setPosting(true);

    try {
      const answer = await answerApi.postAnswer({ 
        doubtId: id, 
        contentJson: newAnswer // In MERN we use contentJson
      });

      setAnswers([...answers, answer]);
      setNewAnswer('');
    } catch (err) {
      alert('Failed to post answer');
    } finally {
      setPosting(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await answerApi.acceptAnswer(answerId);
      
      setAnswers(answers.map(a => 
        a._id === answerId ? { ...a, isAccepted: true } : { ...a, isAccepted: false }
      ));
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
            {doubt.subject && <span className={styles.tag}>{doubt.subject}</span>}
          </div>
          <h1 className={styles.title}>{doubt.title}</h1>
          <div className={styles.meta}>
            <div className={styles.userInfo}>
              <div className={styles.avatarPlaceholder} />
              <div className={styles.userDetails}>
                <span className={styles.userName}>{doubt.authorId?.name || 'Learner'}</span>
                <ReputationBadge points={doubt.authorId?.reputation || 0} />
              </div>
            </div>
            <span className={styles.date}>Asked {new Date(doubt.createdAt).toLocaleDateString()}</span>
          </div>
        </header>
        <div className={styles.content}>
          <p>{typeof doubt.contentJson === 'string' ? doubt.contentJson : 'View details...'}</p>
        </div>
        <footer className={styles.footer}>
          <div className={styles.actions}>
            <button className={styles.voteBtn}>▲</button>
            <span className={styles.voteCount}>{doubt.voteScore || 0}</span>
            <button className={styles.voteBtn}>▼</button>
          </div>
          <button className={styles.shareBtn}>Share</button>
        </footer>
      </article>

      <section className={styles.answersSection}>
        <h2 className={styles.sectionTitle}>{answers.length} Answers</h2>
        <div className={styles.answerList}>
          {answers.map(answer => (
            <div key={answer._id} className={`${styles.answerCard} glass ${answer.isAccepted ? styles.accepted : ''}`}>
              {answer.isAccepted && <div className={styles.acceptedBadge}>✓ Accepted Solution</div>}
              <div className={styles.answerHeader}>
                <div className={styles.userInfo}>
                  <div className={styles.avatarPlaceholder} />
                  <div className={styles.userDetails}>
                    <span className={styles.userName}>{answer.authorId?.name || 'Solver'}</span>
                    <ReputationBadge points={answer.authorId?.reputation || 0} />
                  </div>
                </div>
                <span className={styles.date}>{new Date(answer.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={styles.answerContent}>
                <p>{typeof answer.contentJson === 'string' ? answer.contentJson : 'View full solution...'}</p>
              </div>
              <div className={styles.answerFooter}>
                <div className={styles.actions}>
                  <button className={styles.voteBtn}>▲</button>
                  <span className={styles.voteCount}>{answer.voteScore || 0}</span>
                  <button className={styles.voteBtn}>▼</button>
                </div>
                
                {user?.id === (doubt.authorId?._id || doubt.authorId) && !answer.isAccepted && (
                  <button 
                    onClick={() => handleAcceptAnswer(answer._id)}
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

