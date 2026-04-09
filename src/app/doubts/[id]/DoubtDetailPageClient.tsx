'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { doubtApi, answerApi } from '@/lib/api';
import ReputationBadge from '@/components/user/ReputationBadge';
import { Sparkles, MessageSquare, ChevronRight, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import styles from './doubt-detail.module.css';
import { LoadingPage } from '@/components/ui/Loading';
import ReactMarkdown from 'react-markdown';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function DoubtDetailPageClient({ id }: { id: string }) {
  const { user } = useAuth();
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
          fetch(`/api/doubts/${id}/recommendations`).then(res => res.json()).catch(() => [])
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

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`answers-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'answers',
        filter: `doubt_id=eq.${id}`
      }, async (payload) => {
        const res = await fetch(`/api/doubts/${id}/answers`);
        const data = await res.json();
        if (Array.isArray(data)) setAnswers(data);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handlePostAnswer = async () => {
    if (!newAnswer.trim()) return;
    setPosting(true);
    try {
      await answerApi.postAnswer(id, { content: newAnswer });
      setNewAnswer('');
      const data = await answerApi.getAnswers(id);
      setAnswers(data || []);
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
      await answerApi.acceptAnswer(id, answerId);
      setAnswers(answers.map(a =>
        a.id === answerId ? { ...a, is_accepted: true } : { ...a, is_accepted: false }
      ));
      setDoubt((prev: any) => prev ? { ...prev, status: 'resolved' } : prev);
    } catch (err) {
      alert('Failed to accept solution');
    }
  };

  const handleVote = async (answerId: string, type: number) => {
    if (!user) { alert('Please log in to vote'); return; }
    try {
      const { totalVotes } = await answerApi.vote(answerId, type);
      setAnswers(answers.map(a =>
        a.id === answerId ? { ...a, votes: totalVotes } : a
      ));
    } catch (err) {
      console.error('Vote failed');
    }
  };

  if (loading) return <LoadingPage />;
  if (!doubt) return (
    <div className={styles.notFound}>
      <h2>Doubt not found</h2>
      <p>This doubt may have been deleted.</p>
      <Link href="/doubts">Back to Doubts</Link>
    </div>
  );

  const isAuthor = user?.id === (doubt.author_id || doubt.user_id);
  const isResolved = doubt.status === 'resolved';

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/doubts">Doubts</Link>
          <ChevronRight size={14} />
          <span>{doubt.subjects?.name || 'General'}</span>
        </div>

        {doubt.subjects?.name && (
          <span className={styles.subjectTag}>{doubt.subjects.name}</span>
        )}
        {isResolved && <span className={styles.resolvedBadge}>✓ Resolved</span>}
      </header>

      <div className={styles.questionCard}>
        <h1 className={styles.title}>{doubt.title}</h1>
        <div className={styles.meta}>
          <span className={styles.author}>{doubt.profiles?.username || 'Learner'}</span>
          <span className={styles.date}>Asked {new Date(doubt.created_at).toLocaleDateString()}</span>
          {doubt.profiles?.reputation_points != null && (
            <ReputationBadge points={doubt.profiles.reputation_points} />
          )}
        </div>
        <div className={styles.questionBody}>
          <ReactMarkdown>{doubt.content}</ReactMarkdown>
        </div>
        <div className={styles.questionActions}>
          <button onClick={() => handleVote(doubt.id, 1)} className={styles.voteBtn}>
            ▲ <span>{doubt.votes || 0}</span>
          </button>
          <button
            onClick={handleAskAI}
            className={styles.aiBtn}
            disabled={aiLoading}
          >
            {aiLoading ? '🤖 Thinking...' : '✨ Ask AI to Explain This'}
          </button>
        </div>
      </div>

      {aiResponse && (
        <div className={styles.aiCard}>
          <h3>🧠 AI Explanation</h3>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{aiResponse.explanation}</ReactMarkdown>
          </div>
          {aiResponse.steps && aiResponse.steps.length > 0 && (
            <ol className={styles.stepsList}>
              {aiResponse.steps.map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      <section className={styles.answersSection}>
        <h2 className={styles.answersTitle}>{answers.length} Answer{answers.length !== 1 ? 's' : ''}</h2>

        {answers.length === 0 && (
          <div className={styles.emptyAnswers}>
            <MessageSquare size={32} />
            <p>No answers yet. Be the first to help!</p>
          </div>
        )}

        {answers.map(answer => (
          <div key={answer.id} className={`${styles.answerCard} ${answer.is_accepted ? styles.accepted : ''}`}>
            {answer.is_accepted && (
              <div className={styles.acceptedBadge}>
                <CheckCircle size={16} /> Accepted Solution
              </div>
            )}
            <div className={styles.answerMeta}>
              <span className={styles.author}>{answer.profiles?.username || 'Solver'}</span>
              <span className={styles.date}>{new Date(answer.created_at).toLocaleDateString()}</span>
              {answer.profiles?.reputation_points != null && (
                <ReputationBadge points={answer.profiles.reputation_points} />
              )}
            </div>
            <div className={styles.answerBody}>
              <ReactMarkdown>{answer.content}</ReactMarkdown>
            </div>
            <div className={styles.answerActions}>
              <button onClick={() => handleVote(answer.id, 1)} className={styles.voteBtn}>
                <ThumbsUp size={16} /> {answer.votes > 0 ? answer.votes : ''}
              </button>
              <button onClick={() => handleVote(answer.id, -1)} className={styles.voteBtn}>
                <ThumbsDown size={16} />
              </button>
              {isAuthor && !answer.is_accepted && !isResolved && (
                <button
                  onClick={() => handleAcceptAnswer(answer.id)}
                  className={styles.acceptBtn}
                >
                  <CheckCircle size={16} /> Accept Solution
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {user ? (
        <section className={styles.postAnswerSection}>
          <h3>Your Answer</h3>
          <RichTextEditor
            content={newAnswer}
            onChange={setNewAnswer}
            placeholder="Write a clear, detailed answer..."
          />
          <button
            onClick={handlePostAnswer}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 mt-6"
            disabled={posting || !newAnswer.trim()}
          >
            {posting ? 'Posting...' : 'Post Answer'}
          </button>
        </section>
      ) : (
        <div className={styles.loginPrompt}>
          Please <Link href="/auth">log in</Link> to contribute to this discussion.
        </div>
      )}

      {recommendations.length > 0 && (
        <section className={styles.recommendationsSection}>
          <h3>Recommended for You</h3>
          <div className={styles.recsList}>
            {recommendations.map((rec: any) => (
              <Link key={rec.id} href={`/doubts/${rec.id}`} className={styles.recCard}>
                {rec.subjects?.name && <span className={styles.recSubject}>{rec.subjects.name}</span>}
                <p>{rec.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
