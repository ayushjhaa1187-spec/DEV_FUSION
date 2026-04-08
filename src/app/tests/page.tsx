'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { testApi, subjectApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './tests.module.css';

export default function PracticeTestsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [test, setTest] = useState<any>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let timer: any;
    if (test && !result && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    } else if (timeLeft === 0 && !result) {
      handleSubmitTest(); // Auto-submit
    }
    return () => clearInterval(timer);
  }, [test, result, timeLeft]);

  useEffect(() => {
    if (user) {
      subjectApi.getSubjects().then(setSubjects).catch(console.error);
    }
  }, [user]);

  const handleGenerateTest = async () => {
    if (!selectedSubject || !topic) return;
    setIsGenerating(true);
    setTest(null);
    setResult(null);

    try {
      const data = await testApi.generate({ subject_id: selectedSubject, topic });
      setTest(data);
      setAnswers(new Array(data.questions.length).fill(-1));
      setTimeLeft(300); // 5 Minutes
    } catch (err) {
      alert('Failed to generate test. Make sure you have subject data in your database.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!test || result) return;
    
    setIsSubmitting(true);
    setTimeLeft(null); // Stop timer
    try {
      // Ensure we send current answers state
      const data = await testApi.submit(test.id, answers);
      setResult(data);
    } catch (err) {
      alert('Failed to submit test');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={`${styles.authNotice} glass`}>
          <h2>Ready to Practice?</h2>
          <p>Log in to generate personalized AI tests and track your academic progress.</p>
          <a href="/auth" className={styles.loginBtn}>Get Started</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Practice Engine</h1>
        <p className={styles.subtitle}>Test your knowledge with personalized quizzes generated just for you by Gemini 1.5 Pro.</p>
      </header>

      {!test && !result && (
        <section className={`${styles.generatorCard} glass`}>
          <div className={styles.inputGroup}>
            <label>Academic Subject</label>
            <select 
              className={styles.select}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Select a subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code || 'Gen'})</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Specific Topic</label>
            <input 
              className={styles.input}
              type="text" 
              placeholder="e.g. CPU Scheduling or photosynthesis" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <button 
            className={styles.generateBtn} 
            onClick={handleGenerateTest}
            disabled={isGenerating || !selectedSubject || !topic}
          >
            {isGenerating ? (
              <span className={styles.loaderLine}>Evaluating Subject Depth...</span>
            ) : 'Spin Up AI Quiz'}
          </button>
          {isGenerating && (
            <div style={{ marginTop: '24px' }}>
              <Skeleton width="100%" height="2rem" className="mb-2" />
              <Skeleton width="80%" height="1rem" />
            </div>
          )}
        </section>
      )}

      {test && !result && (
        <section className={styles.testArea}>
          <div className={`${styles.testHeader} glass`}>
            <div className={styles.testMetaInfo}>
               <div className={styles.subjectTag}>
                 {subjects.find(s => s.id === test.subject_id)?.name}
               </div>
               <h2 className={styles.testTopic}>{test.topic}</h2>
            </div>
            <div className={styles.timerBox}>
              <span className={styles.timerLabel}>Time Remaining</span>
              <span className={`${styles.timerValue} ${timeLeft && timeLeft < 60 ? styles.timerUrgent : ''}`}>
                {Math.floor((timeLeft || 0) / 60)}:{((timeLeft || 0) % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className={styles.questionGrid}>
            {test.questions.map((q: any, qIdx: number) => (
              <div key={q.id || qIdx} className={`${styles.questionCard} glass`}>
                <div className={styles.qHeader}>
                  <span className={styles.qNum}>Question {qIdx + 1}</span>
                </div>
                <p className={styles.questionText}>{q.question_text}</p>
                <div className={styles.optionGrid}>
                  {q.options.map((opt: string, optIdx: number) => (
                    <button 
                      key={optIdx} 
                      className={`${styles.optBtn} ${answers[qIdx] === optIdx ? styles.selected : ''}`}
                      onClick={() => {
                        const newAns = [...answers];
                        newAns[qIdx] = optIdx;
                        setAnswers(newAns);
                      }}
                    >
                      <span className={styles.optLetter}>{String.fromCharCode(65 + optIdx)}</span>
                      <span className={styles.optText}>{opt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.testFooter}>
            <div className={styles.completionStatus}>
              {answers.filter(a => a !== -1).length} of {test.questions.length} answered
            </div>
            <button 
              className="sb-btnPrimary" 
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              style={{ border: 'none' }}
            >
              {isSubmitting ? 'Evaluating Performance...' : 'Submit Assessment —>'}
            </button>
          </div>
        </section>
      )}

      {result && (
        <section className={`${styles.resultCard} glass`}>
          <div className={styles.resultHeader}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreNumber}>{result.score}%</span>
              <span className={styles.scoreLabel}>Score</span>
            </div>
            <div className={styles.resultText}>
              <h2>{result.score >= 80 ? 'Mastery Achieved!' : result.score >= 50 ? 'Good Effort!' : 'Keep Studying!'}</h2>
              <p>You earned <strong>+{result.pointsEarned} Reputation Points</strong> for completing this assessment.</p>
            </div>
          </div>
          <div className={styles.resultActions}>
            <button className={styles.resetBtn} onClick={() => { setTest(null); setResult(null); }}>
              Generate New Quiz
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
