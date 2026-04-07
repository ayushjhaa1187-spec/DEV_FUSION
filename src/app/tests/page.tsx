'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { testApi } from '@/lib/api';
import styles from './tests.module.css';

export default function PracticeTestsPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [test, setTest] = useState<any>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  const handleGenerateTest = async () => {
    if (!subject || !topic) return;
    setIsGenerating(true);
    setTest(null);
    setResult(null);

    try {
      const data = await testApi.generate({ subject, topic, difficulty: 'Medium', count: 5 });
      setTest(data);
      setAnswers(new Array(data.questions.length).fill(-1));
      setStartedAt(new Date());
    } catch (err) {
      alert('Failed to generate test');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!test || answers.includes(-1)) {
       alert('Please answer all questions before submitting.');
       return;
    }

    try {
      const data = await testApi.submit({ 
        testId: test._id, 
        answers,
        startedAt: startedAt?.toISOString(),
        submittedAt: new Date().toISOString()
      });
      setResult(data);
    } catch (err) {
      alert('Failed to submit test');
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
        <p className={styles.subtitle}>Test your knowledge with personalized quizzes generated just for you.</p>
      </header>

      {!test && !result && (
        <section className={`${styles.generatorCard} glass`}>
          <div className={styles.inputGroup}>
            <label>Subject</label>
            <input 
              type="text" 
              placeholder="e.g. Operating Systems" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Specific Topic</label>
            <input 
              type="text" 
              placeholder="e.g. CPU Scheduling" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <button 
            className={styles.generateBtn} 
            onClick={handleGenerateTest}
            disabled={isGenerating}
          >
            {isGenerating ? 'Gemini is generating...' : 'Generate 5-Question Quiz'}
          </button>
        </section>
      )}

      {test && !result && (
        <section className={styles.testArea}>
          <div className={styles.testHeader}>
            <h2>{test.topic} - {test.subject}</h2>
            <span className={styles.badge}>{test.questions.length} Questions</span>
          </div>
          <div className={styles.questionList}>
            {test.questions.map((q: any, qIdx: number) => (
              <div key={q._id || qIdx} className={`${styles.questionCard} glass`}>
                <p className={styles.questionText}>{qIdx + 1}. {q.text}</p>
                <div className={styles.options}>
                  {q.options.map((opt: string, optIdx: number) => (
                    <label key={optIdx} className={`${styles.option} ${answers[qIdx] === optIdx ? styles.selected : ''}`}>
                      <input 
                        type="radio" 
                        name={`q-${qIdx}`} 
                        checked={answers[qIdx] === optIdx}
                        onChange={() => {
                          const newAns = [...answers];
                          newAns[qIdx] = optIdx;
                          setAnswers(newAns);
                        }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className={styles.submitBtn} onClick={handleSubmitTest}>Submit Test</button>
        </section>
      )}

      {result && (
        <section className={`${styles.resultCard} glass`}>
          <div className={styles.resultHeader}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreNumber}>{Math.round((result.score / result.totalQuestions) * 100)}%</span>
              <span className={styles.scoreLabel}>Score</span>
            </div>
            <div className={styles.resultText}>
              <h2>Great Job!</h2>
              <p>You scored {result.score}/{result.totalQuestions} and earned reputation points for completing this test.</p>
            </div>
          </div>
          <button className={styles.resetBtn} onClick={() => { setTest(null); setResult(null); }}>
            Take Another Test
          </button>
        </section>
      )}
    </div>
  );
}
