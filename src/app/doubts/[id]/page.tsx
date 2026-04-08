'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { doubtApi, answerApi, aiApi } from '@/lib/api';
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

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSolution, setAiSolution] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const doubtData = await doubtApi.getDoubt(id);
        const answersData = await answerApi.getAnswers(id);
        
        setDoubt(doubtData);
        setAnswers(answersData || []);
      } catch (err) {
        console.error('Failed to load doubt details');
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Note: In a full implementation, we would set up a Supabase Realtime subscription here
    // for the 'answers' table filtered by doubt_id.
  }, [id]);

  const handlePostAnswer = async () => {
    if (!newAnswer.trim()) return;
    setPosting(true);

    try {
      const answer = await answerApi.postAnswer(id, { 
        content: newAnswer
      });

      setAnswers([...answers, answer]);
      setNewAnswer('');
    } catch (err) {
      alert('Failed to post answer');
    } finally {
      setPosting(false);
    }
  };

  const handleAiHelp = async () => {
    if (!doubt) return;
    setAiLoading(true);
    try {
      const data = await aiApi.solveDoubt({ 
        title: doubt.title, 
        content: doubt.content 
      });
      setAiSolution(data.answer || data.solution);
    } catch (err) {
      alert('AI service error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await answerApi.acceptAnswer(answerId);
      setAnswers(answers.map(a => 
        a.id === answerId ? { ...a, is_accepted: true } : { ...a, is_accepted: false }
      ));
    } catch (err) {
      alert('Failed to accept solution');
    }
  };

  const handleVote = async (answerId: string, type: number) => {
    try {
      const { totalVotes } = await answerApi.vote(answerId, type);
      setAnswers(answers.map(a => 
        a.id === answerId ? { ...a, votes: totalVotes } : a
      ));
    } catch (err) {
      console.error('Vote failed');
    }
  };

  if (loading) return <div className={styles.loading}>Loading discussion...</div>;
  if (!doubt) return <div className={styles.errorBanner}>Doubt not found or was deleted.</div>;

  return (
    <div className={styles.container}>
      <article className={`${styles.mainDoubt} glass sb-stagger-1`}>
        <header className={styles.header}>
          <div className={styles.tags}>
            {doubt.subjects?.name && <span className={styles.tag}>{doubt.subjects.name}</span>}
          </div>
          <h1 className={styles.title}>{doubt.title}</h1>
          <div className={styles.meta}>
            <div className={styles.userInfo}>
              <div className={styles.avatarPlaceholder} />
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
            <span className={styles.voteCount}>{doubt.votes || 0}</span>
            <button className={styles.voteBtn}>▼</button>
          </div>
          <div className={styles.footerBtns}>
            <button onClick={handleAiHelp} className={styles.aiHelpBtn} disabled={aiLoading}>
              {aiLoading ? 'AI Thinking...' : '✨ Get AI Hint'}
            </button>
            <button className={styles.shareBtn}>Share</button>
          </div>
        </footer>

        {aiSolution && (
          <div className={styles.aiCard}>
            <h4>AI Assistant Suggestion</h4>
            <div className="preview-content">
               {aiSolution.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
        )}
      </article>

      <section className={`${styles.answersSection} sb-stagger-2`}>
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
                  <button onClick={() => handleVote(answer.id, 1)} className={styles.voteBtn}>▲</button>
                  <span className={styles.voteCount}>{answer.votes || 0}</span>
                  <button onClick={() => handleVote(answer.id, -1)} className={styles.voteBtn}>▼</button>
                </div>
                
                {user?.id === doubt.author_id && !answer.is_accepted && (
                  <button 
                    onClick={() => handleAcceptAnswer(answer.id)}
                    className={styles.acceptBtn}
                  >
                    Accept Solution
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

