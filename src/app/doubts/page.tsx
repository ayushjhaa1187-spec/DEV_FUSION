'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { doubtApi, aiApi, subjectApi, authApi } from '@/lib/api';
import ReputationBadge from '@/components/user/ReputationBadge';
import { DoubtCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import AskDoubtModal from '@/components/doubts/AskDoubtModal';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Search, X } from 'lucide-react';
import styles from './doubts.module.css';

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefillQuestion, setPrefillQuestion] = useState('');
  const [isAiSolving, setIsAiSolving] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchDebounce = useRef<any>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        const [profile, subs] = await Promise.all([
          authApi.getMyProfile(),
          authApi.getMySubjects()
        ]);
        setUserProfile(profile);
        setUserSubjects(subs.map((s: any) => s.subject_id));
      } catch (err) {
        console.error('Failed to load user context', err);
      }
    }
    loadUserData();
  }, []);

  const loadDoubts = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (activeSubject) params.subject_id = activeSubject;
      if (filterType === 'unanswered') params.filter = 'unanswered';
      if (filterType === 'my-branch' && userProfile?.branch) params.branch = userProfile.branch;
      if (filterType === 'my-subjects' && userSubjects.length > 0) {
        params.filter = 'my_subjects';
        params.user_subjects = userSubjects.join(',');
      }
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const [doubtsData, subjectsData] = await Promise.all([
        doubtApi.getDoubts(Object.keys(params).length ? params : undefined),
        subjectApi.getSubjects()
      ]);
      setDoubts(doubtsData || []);
      if (subjectsData) setSubjects(subjectsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load doubts');
    } finally {
      setLoading(false);
    }
  }, [activeSubject, filterType, userProfile, userSubjects, searchQuery]);

  useEffect(() => {
    loadDoubts(true);
  }, [loadDoubts]);

  // Supabase Realtime replaces 15s polling
  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel('doubts-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'doubts' }, () => loadDoubts(false))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'doubts' }, () => loadDoubts(false))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadDoubts]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearchQuery(val);
    }, 400);
  };

  const handleAiSolve = async () => {
    if (!aiQuestion.trim()) return;
    setIsAiSolving(true);
    setAiResponse(null);
    try {
      const data = await aiApi.solveDoubt({ question: aiQuestion });
      setAiResponse(data);
    } catch {
      setError('AI service temporary unavailable. Try again later.');
    } finally {
      setIsAiSolving(false);
    }
  };

  const handlePostToCommunity = () => {
    setPrefillQuestion(aiQuestion);
    setIsModalOpen(true);
  };

  const filterButtons = [
    { key: 'all', label: 'Recent' },
    { key: 'unanswered', label: 'Unanswered' },
    ...(userProfile?.branch ? [{ key: 'my-branch', label: 'My Branch' }] : []),
    ...(userSubjects.length > 0 ? [{ key: 'my-subjects', label: 'My Subjects' }] : []),
  ];

  return (
    <>
      <h1>Doubt Feed</h1>
      <p>Get instant logical breakdowns from AI or connect with top-rated student peers for conceptual clarity.</p>

      {/* AI Solver Panel */}
      <div className={styles.aiPanel}>
        <h2>Instant Conceptual Guidance</h2>
        <input
          type="text"
          placeholder="Explain the intuition behind 'P vs NP' or ask a specific doubt..."
          value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAiSolve()}
          className={styles.aiInput}
        />
        <button onClick={handleAiSolve} disabled={isAiSolving}>
          {isAiSolving ? 'Synthesizing...' : 'Solve with AI'}
        </button>

        {aiResponse && (
          <div>
            <h3>Logical Breakdown</h3>
            <p>{aiResponse.explanation}</p>
            {aiResponse.steps?.length > 0 && (
              <ol>
                {aiResponse.steps.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
            <button onClick={handlePostToCommunity}>Post to Community</button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className={styles.searchWrapper}>
        <Search />
        <input
          type="text"
          placeholder="Search doubts by title or content..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={styles.searchInput}
        />
        {searchInput && (
          <button onClick={() => { setSearchInput(''); setSearchQuery(''); }}>
            <X />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className={styles.filters}>
        <button onClick={() => setActiveSubject(null)} className={`${styles.subjectBtn} ${!activeSubject ? styles.active : ''}`}>
          All Subjects
        </button>
        {subjects.map(s => (
          <button key={s.id} onClick={() => setActiveSubject(s.id)} className={`${styles.subjectBtn} ${activeSubject === s.id ? styles.active : ''}`}>
            {s.name}
          </button>
        ))}
      </div>

      <div className={styles.toggleRow}>
        {filterButtons.map(({ key, label }) => (
          <button key={key} onClick={() => setFilterType(key)} className={`${styles.toggleBtn} ${filterType === key ? styles.active : ''}`}>
            {label}
          </button>
        ))}
        <button onClick={() => setIsModalOpen(true)} className="sb-btnPrimary" style={{ whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}>
          Ask Community
        </button>
      </div>

      {/* Doubts Grid */}
      {loading ? (
        <div className={styles.grid}>
          {[1,2,3,4,5,6].map(i => <DoubtCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div>
          <p>{error}</p>
          <button onClick={() => loadDoubts(true)} className="sb-btnPrimary" style={{ marginTop: 16 }}>Retry</button>
        </div>
      ) : doubts.length > 0 ? (
        <div className={styles.grid}>
          {doubts.map((doubt) => (
            <Link href={`/doubts/${doubt.id}`} key={doubt.id} className={styles.doubtCard}>
              <div className={styles.cardMeta}>
                <span>{doubt.subjects?.name || 'General'}</span>
                {doubt.status === 'resolved' && <span className={styles.solved}>Solved</span>}
                <span>{doubt.votes ?? 0} votes</span>
              </div>
              <h3>{doubt.title}</h3>
              <p>{doubt.content?.substring(0, 150)}...</p>
              <div className={styles.cardFooter}>
                {doubt.profiles?.avatar_url ? (
                  <Image
                    src={doubt.profiles.avatar_url || '/default-avatar.png'}
                    alt={`${doubt.profiles?.username || 'Learner'}'s avatar`}
                    width={40}
                    height={40}
                    className="rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    {doubt.profiles?.username?.[0] || 'L'}
                  </div>
                )}
                <span>{doubt.profiles?.username || 'Learner'}</span>
                <ReputationBadge points={doubt.profiles?.reputation_points} />
                <span>{new Date(doubt.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState onAction={() => setIsModalOpen(true)} />
      )}

      <AskDoubtModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setPrefillQuestion(''); }}
        prefillContent={prefillQuestion}
        onPublished={() => loadDoubts(false)}
      />
    </>
  );
}
