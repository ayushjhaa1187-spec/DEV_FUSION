'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doubtApi, aiApi, subjectApi, authApi } from '@/lib/api';
import ReputationBadge from '@/components/user/ReputationBadge';
import { DoubtCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'next/navigation';
import styles from './doubts.module.css';

export default function DoubtsPage() {
  const router = useRouter();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);

  useEffect(() => {
    async function loadUserData() {
      try {
        const [profile, subjects] = await Promise.all([
          authApi.getMyProfile(),
          authApi.getMySubjects()
        ]);
        setUserProfile(profile);
        setUserSubjects(subjects.map((s: any) => s.subject_id));
      } catch (err) {
        console.error('Failed to load user context', err);
      }
    }
    loadUserData();
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params: any = {};
        if (activeSubject) params.subject_id = activeSubject;
        
        if (filterType === 'unanswered') params.filter = 'unanswered';
        if (filterType === 'my-branch' && userProfile?.branch) params.branch = userProfile.branch;
        if (filterType === 'my-subjects' && userSubjects.length > 0) {
          params.filter = 'my_subjects';
          params.user_subjects = userSubjects.join(',');
        }

        const [doubtsData, subjectsData] = await Promise.all([
          doubtApi.getDoubts(Object.keys(params).length ? params : undefined),
          subjectApi.getSubjects()
        ]);
        setDoubts(doubtsData || []);
        setSubjects(subjectsData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeSubject, filterType, userProfile, userSubjects]);

  const [isAiSolving, setIsAiSolving] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiQuestion, setAiQuestion] = useState('');

  const handleAiSolve = async () => {
    if (!aiQuestion.trim()) return;
    setIsAiSolving(true);
    setAiResponse(null);
    try {
      const data = await aiApi.solveDoubt({ question: aiQuestion });
      setAiResponse(data);
    } catch (err) {
      setError('AI service temporary unavailable. Try again later.');
    } finally {
      setIsAiSolving(false);
    }
  };

  return (
    <div className="sb-page">
      <header className={styles.premiumHeader}>
        <div className="sb-section">
          <div className="sb-heroBadge">
            <span className="sb-badgeDot" />
            24/7 Peer & AI Support
          </div>
          <h1 className="sb-title">Doubt <span>Feed</span></h1>
          <p className="sb-subtitle">
            Get instant logical breakdowns from AI or connect with top-rated student peers for conceptual clarity.
          </p>

          <div className={`${styles.aiSection} glass`} style={{ marginTop: '40px', borderRadius: '32px', padding: '32px' }}>
            <div className={styles.aiHeader}>
              <span className={styles.aiBadge}>✨ SkillBridge AI Agent</span>
              <h2 className={styles.aiTitle}>Instant Conceptual Guidance</h2>
            </div>
            <div className={styles.aiInputWrapper}>
              <input 
                type="text" 
                placeholder="Explain the intuition behind 'P vs NP' or ask a specific doubt..." 
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className={styles.aiInput}
              />
              <button 
                onClick={handleAiSolve}
                className="sb-btnPrimary"
                disabled={isAiSolving}
                style={{ borderRadius: '16px', border: 'none' }}
              >
                {isAiSolving ? 'Synthesizing...' : 'Solve with AI'}
              </button>
            </div>
            {aiResponse && (
              <div className={styles.aiOutput} style={{ animation: 'fadeUp 0.6s ease both' }}>
                <div className={styles.aiExplanation}>
                  <h3>Logical Breakdown</h3>
                  <p>{aiResponse.explanation}</p>
                </div>
                {aiResponse.steps?.length > 0 && (
                  <div className={styles.aiSteps}>
                    {aiResponse.steps.map((step: string, i: number) => (
                      <div key={i} className={styles.aiStep}>
                        <span>{i + 1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="sb-section" style={{ paddingTop: '0' }}>
        <div className={styles.filterBar}>
          <div className={styles.subjectScroll}>
            <button 
              className={`${styles.subjectBtn} ${!activeSubject ? styles.active : ''}`}
              onClick={() => setActiveSubject(null)}
            >
              All Subjects
            </button>
            {subjects.map(s => (
              <button 
                key={s.id} 
                className={`${styles.subjectBtn} ${activeSubject === s.id ? styles.active : ''}`}
                onClick={() => setActiveSubject(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className={styles.filterToggles}>
            <button 
              onClick={() => setFilterType('all')}
              className={`${styles.toggleBtn} ${filterType === 'all' ? styles.active : ''}`}
            >
              Recent
            </button>
            <button 
              onClick={() => setFilterType('unanswered')}
              className={`${styles.toggleBtn} ${filterType === 'unanswered' ? styles.active : ''}`}
            >
              Unanswered
            </button>
            {userProfile?.branch && (
              <button 
                onClick={() => setFilterType('my-branch')}
                className={`${styles.toggleBtn} ${filterType === 'my-branch' ? styles.active : ''}`}
              >
                My Branch
              </button>
            )}
            {userSubjects.length > 0 && (
              <button 
                onClick={() => setFilterType('my-subjects')}
                className={`${styles.toggleBtn} ${filterType === 'my-subjects' ? styles.active : ''}`}
              >
                My Subjects
              </button>
            )}
          </div>

          <Link href="/doubts/ask" className="sb-btnPrimary" style={{ whiteSpace: 'nowrap', border: 'none' }}>
            Ask Community
          </Link>
        </div>

        {loading ? (
          <div className={styles.feedGrid}>
            {[1, 2, 3, 4, 5, 6].map(i => <DoubtCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className={styles.errorCard}>{error}</div>
        ) : doubts.length > 0 ? (
          <div className={styles.feedGrid}>
            {doubts.map((doubt) => (
              <Link href={`/doubts/${doubt.id}`} key={doubt.id} className={`${styles.premiumCard} glass`}>
                <div className={styles.cardHeader}>
                  <div className={styles.subjectTag}>
                    {doubt.subjects?.name || 'General'}
                  </div>
                  {doubt.status === 'resolved' && <span className={styles.statusBadge}>✓ Solved</span>}
                </div>
                
                <h3 className={styles.cardTitle}>{doubt.title}</h3>
                <p className={styles.cardSnippet}>
                  {doubt.content?.substring(0, 150)}...
                </p>

                <div className={styles.cardInfo}>
                  <div className={styles.author}>
                    <div className={styles.authAvatar}>
                      {doubt.profiles?.avatar_url ? (
                        <img src={doubt.profiles.avatar_url} alt="" />
                      ) : (
                        <span>{doubt.profiles?.username?.[0] || 'L'}</span>
                      )}
                    </div>
                    <div>
                      <span className={styles.authName}>{doubt.profiles?.username || 'Learner'}</span>
                      <ReputationBadge points={doubt.profiles?.reputation_points || 0} />
                    </div>
                  </div>
                  <div className={styles.cardMeta}>
                    <span>{new Date(doubt.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon="🤔" 
            title="No doubts yet" 
            description="Be the first to ask a question!" 
            actionLabel="Ask a Doubt" 
            onAction={() => router.push('/doubts/ask')} 
          />
        )}
      </main>
    </div>
  );
}

