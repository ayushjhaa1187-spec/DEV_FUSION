import { createSupabaseServer } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Trophy, BarChart3, ChevronRight } from 'lucide-react';
import styles from './results.module.css';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestResultsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  // Fetch attempt with test and questions
  const { data: attempt, error: attemptError } = await supabase
    .from('practice_attempts')
    .select(`
      *,
      practice_tests (
        id,
        topic,
        subjects (name),
        practice_questions (*)
      )
    `)
    .eq('id', id)
    .single();

  if (attemptError || !attempt) {
    console.error('Fetch error:', attemptError);
    notFound();
  }

  const test = attempt.practice_tests;
  const questions = test.practice_questions;
  const selectedAnswers = attempt.selected_answers || {};

  // Fetch Leaderboard for this topic
  const { data: leaderboard } = await supabase
    .from('test_leaderboard')
    .select('*')
    .eq('topic', test.topic)
    .limit(5);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.metaRow}>
          <span className={styles.subjectBag}>{test.subjects?.name}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.date}>{new Date(attempt.completed_at).toLocaleDateString()}</span>
        </div>
        <h1 className={styles.title}>{test.topic} <span>Analysis</span></h1>
      </header>

      <div className={styles.layout}>
        <main className={styles.mainContent}>
          <section className={`${styles.statsGrid} glass`}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Score</span>
              <div className={styles.statValue}>
                {attempt.score}<span>%</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Accuracy</span>
              <div className={styles.statValue}>
                {Math.round((attempt.score / 100) * questions.length)}/{questions.length}
              </div>
            </div>
          </section>

          <div className={styles.questionList}>
            <h2 className={styles.sectionTitle}>Question Breakdown</h2>
            {questions.map((q: any, i: number) => {
              const selectedIdx = selectedAnswers[q.id];
              const isCorrect = selectedIdx === q.correct_answer_index;

              return (
                <div key={q.id} className={`${styles.questionCard} glass ${isCorrect ? styles.correct : styles.incorrect}`}>
                  <div className={styles.qHeader}>
                    <span className={styles.qNum}>Question {i + 1}</span>
                    {isCorrect ? (
                      <span className={styles.correctBadge}><CheckCircle2 size={16} /> Correct</span>
                    ) : (
                      <span className={styles.incorrectBadge}><XCircle size={16} /> Incorrect</span>
                    )}
                  </div>
                  <p className={styles.questionText}>{q.question_text}</p>
                  
                  <div className={styles.optionsReview}>
                    {q.options.map((opt: string, optIdx: number) => {
                      const isSelected = selectedIdx === optIdx;
                      const isCorrectOpt = q.correct_answer_index === optIdx;
                      
                      let optClass = '';
                      if (isSelected) optClass = isCorrect ? styles.optSelectedCorrect : styles.optSelectedIncorrect;
                      if (!isSelected && isCorrectOpt) optClass = styles.optShouldHaveBeen;

                      return (
                        <div key={optIdx} className={`${styles.optReviewItem} ${optClass}`}>
                          <span className={styles.optLetter}>{String.fromCharCode(65 + optIdx)}</span>
                          <span className={styles.optText}>{opt}</span>
                          {isSelected && <span className={styles.yourChoice}>Your Choice</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className={styles.explanationBox}>
                      <h3>AI Concept Explanation</h3>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        <aside className={styles.sidebar}>
          <div className={`${styles.sidebarCard} glass`}>
            <div className={styles.sidebarHeader}>
              <Trophy className={styles.sidebarIcon} size={20} />
              <h3>Topic Leaderboard</h3>
            </div>
            <div className={styles.leaderboardList}>
              {leaderboard && leaderboard.length > 0 ? leaderboard.map((entry: any, i: number) => (
                <div key={i} className={styles.leaderboardItem}>
                  <span className={styles.rank}>#{i + 1}</span>
                  <div className={styles.userMini}>
                    <img src={entry.avatar_url || `https://ui-avatars.com/api/?name=${entry.username}`} alt="" />
                    <span>{entry.username}</span>
                  </div>
                  <span className={styles.bestScore}>{entry.best_score}%</span>
                </div>
              )) : (
                <p className={styles.emptyText}>Be the first to ace this topic!</p>
              )}
            </div>
            <Link href="/leaderboard" className={styles.sidebarLink}>
              View Full Leaderboard <ChevronRight size={16} />
            </Link>
          </div>

          <div className={`${styles.sidebarCard} glass`} style={{ marginTop: '24px' }}>
             <div className={styles.sidebarHeader}>
              <BarChart3 className={styles.sidebarIcon} size={20} />
              <h3>Next Steps</h3>
            </div>
            <p className={styles.sidebarAdvice}>
              {attempt.score >= 80 
                ? "You've mastered this topic! Try a different subject to broaden your expertise."
                : "A little more review on the highlighted concepts will help you cross the 90% threshold."}
            </p>
            <Link href="/tests" className="sb-btnPrimary" style={{ width: '100%', marginTop: '16px', border: 'none', textAlign: 'center', display: 'block' }}>
              Practice More
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
