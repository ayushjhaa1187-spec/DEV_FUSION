'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, XCircle, ChevronRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import styles from './results.module.css';

export default function ResultsClient({ attempt, test, questions, leaderboard }: any) {
  const [hasCelebrated, setHasCelebrated] = useState(false);

  useEffect(() => {
    if (attempt?.score >= 70 && !hasCelebrated) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c3aed', '#06d6a0', '#f59e0b']
      });
      setHasCelebrated(true);
    }
  }, [attempt?.score, hasCelebrated]);

  const scoreColor = attempt.score >= 80 ? '#06d6a0' : attempt.score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className={styles.container}>
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div className={styles.metaRow}>
          <span className={styles.subjectBag}>{test.subjects?.name}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.date}>{new Date(attempt.completed_at).toLocaleDateString()}</span>
        </div>
        <h1 className={styles.title}>{test.topic} <span>Analysis</span></h1>
      </motion.header>

      <div className={styles.layout}>
        <main className={styles.mainContent}>
          <section className={`${styles.statsGrid} glass`}>
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className={styles.statCard}
            >
              <span className={styles.statLabel}>Total Score</span>
              <div className={styles.scoreContainer}>
                <svg className={styles.circularProgress} viewBox="0 0 100 100">
                  <circle className={styles.circleBg} cx="50" cy="50" r="45" />
                  <motion.circle 
                    className={styles.circleProgress} 
                    cx="50" cy="50" r="45" 
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * attempt.score) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    style={{ stroke: scoreColor }}
                  />
                </svg>
                <div className={styles.scoreText}>
                  {attempt.score}<span>%</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.3 }}
               className={styles.statCard}
            >
              <span className={styles.statLabel}>Accuracy</span>
              <div className={styles.statValue}>
                {Math.round((attempt.score / 100) * questions.length)}/{questions.length}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>Questions Answered Correctly</p>
            </motion.div>
          </section>

          <div className={styles.questionList}>
            <h2 className={styles.sectionTitle}>Question Breakdown</h2>
            {questions.map((q: any, i: number) => {
              const selectedIdx = attempt.selected_answers?.[q.id];
              const isCorrect = selectedIdx === q.correct_answer_index;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  key={q.id} 
                  className={`${styles.questionCard} glass ${isCorrect ? styles.correct : styles.incorrect}`}
                >
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
                        <div key={optIdx} className={`${styles.optReviewItem} ${optClass} relative`}>
                          <span className={styles.optLetter}>{String.fromCharCode(65 + optIdx)}</span>
                          <span className={styles.optText}>{opt}</span>
                          {isSelected && <span className={styles.yourChoice}>Your Choice</span>}
                          {isCorrectOpt && !isCorrect && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase rounded-lg border border-emerald-500/20">
                              Official Solution
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-8 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                        <Sparkles size={40} color="#6366f1" />
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                          <Sparkles size={16} color="#818cf8" />
                        </div>
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Neural Insight</h3>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed font-medium">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </main>

        <aside className={styles.sidebar}>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`${styles.sidebarCard} glass`}
          >
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
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={`${styles.sidebarCard} glass`} 
            style={{ marginTop: '24px' }}
          >
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
          </motion.div>
        </aside>
      </div>
    </div>
  );
}

// Sparkles icon for explanation
function Sparkles({ size, color }: { size: number, color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}
