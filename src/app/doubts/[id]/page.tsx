'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { doubtApi, answerApi, aiApi } from '@/lib/api';
import ReputationBadge from '@/components/user/ReputationBadge';
import { Sparkles, MessageSquare, ChevronRight } from 'lucide-react';
import styles from './doubt-detail.module.css';
import { LoadingPage } from '@/components/ui/Loading';
import ReactMarkdown from 'react-markdown';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function DoubtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const { id } = use(params);
  const [doubt, setDoubt] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [doubtData, answersData, recsData] = await Promise.all([
          doubtApi.getDoubt(id),
          answerApi.getAnswers(id),
          fetch(`/api/doubts/${id}/recommendations`).then(res => res.json())
        ]);
        
        setDoubt(doubtData);
        setAnswers(answersData || []);
        setRecommendations(recsData || []);
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

  const handleAskAI = async () => {
    if (!doubt) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch('/api/ai/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: doubt.title + '\n' + doubt.content,
          context: doubt.subjects?.name 
        })
      });
      const data = await res.json();
      setAiResponse(data);
    } catch (err) {
      alert('AI service temporary unavailable. Try again later.');
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

  if (loading) return <LoadingPage text="Synthesizing discussion..." />;
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
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{doubt.content}</ReactMarkdown>
          </div>
        </div>
        <footer className={styles.footer}>
          <div className={styles.actions}>
            <button className={styles.voteBtn}>▲</button>
            <span className={styles.voteCount}>{doubt.votes || 0}</span>
            <button className={styles.shareBtn}>Share</button>
          </div>
        </footer>

        <div className={styles.aiAssistSection}>
          <button 
            className={styles.btnAiAssist} 
            onClick={handleAskAI}
            disabled={aiLoading}
          >
            {aiLoading ? '🤖 Thinking...' : '✨ Ask AI to Explain This'}
          </button>
          
          {aiResponse && (
            <div className={styles.aiResponseCard}>
              <h3>🧠 AI Explanation</h3>
              <p className={styles.aiOverview}>{aiResponse.explanation}</p>
              {aiResponse.steps && aiResponse.steps.length > 0 && (
                <ol className={styles.aiSteps}>
                  {aiResponse.steps.map((step: string, i: number) => <li key={i}>{step}</li>)}
                </ol>
              )}
              {aiResponse.suggested_tags && aiResponse.suggested_tags.length > 0 && (
                <div className={styles.aiTags}>
                  {aiResponse.suggested_tags.map((tag: string) => (
                    <span key={tag} className={styles.aiTag}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{answer.content}</ReactMarkdown>
                </div>
              </div>
              <div className={styles.answerFooter}>
                <div className={styles.actions}>
                  <button onClick={() => handleVote(answer.id, 1)} className={styles.voteBtn}>▲</button>
                  <span className={styles.voteCount}>{answer.votes || 0}</span>
                  <button onClick={() => handleVote(answer.id, -1)} className={styles.voteBtn}>▼</button>
                </div>
                
                {user?.id === doubt.user_id && !answer.is_accepted && doubt.status !== 'resolved' && (
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
          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <RichTextEditor 
              content={newAnswer}
              onChange={setNewAnswer}
              placeholder="Provide a logical step-by-step resolution..."
            />
          </div>
          <button 
            className={styles.postBtn} 
            onClick={handlePostAnswer}
            disabled={posting || !newAnswer.trim()}
          >
            {posting ? 'Posting...' : 'Post Answer'}
          </button>
        </section>
      ) : (
        <section className={`${styles.authNotice} glass`}>
          <p>Please <a href="/auth">log in</a> to contribute to this discussion.</p>
        </section>
      )}

      <aside className={styles.sidebar}>
        <div className={`${styles.recommendCard} glass`}>
          <h3 className={styles.sideTitle}>
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Recommended for You
          </h3>
          <div className={styles.recommendList}>
            {recommendations.length > 0 ? (
              recommendations.map((rec: any) => (
                <Link href={`/doubts/${rec.id}`} key={rec.id} className={styles.sideItem}>
                  <div className={styles.sideInfo}>
                    <span className={styles.sideSubject}>{rec.subjects?.name}</span>
                    <p className={styles.sideText}>{rec.title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </Link>
              ))
            ) : (
              <div className={styles.sideEmpty}>
                <MessageSquare className="w-8 h-8 opacity-10 mb-2" />
                <p>No similar discussions yet.</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
