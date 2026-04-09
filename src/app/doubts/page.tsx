'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
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
  const [filterType, setFilterType] = useState<string>('all');
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
      const params: Record<string, string> = {};
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
      <div className={styles.page}>
        <div className={styles.hero}>
          <span className={styles.heroBadge}>24/7 Peer & AI Support</span>
          <h1 className={styles.heroTitle}>Doubt Feed</h1>
          <p className={styles.heroSub}>Get instant logical breakdowns from AI or connect with top-rated student peers for conceptual clarity.</p>
        </div>

        {/* AI Solver Panel */}
        <div className={styles.aiPanel}>
          <div className={styles.aiPanelHeader}>
            <span className={styles.aiBadge}>SKILLBRIDGE AI AGENT</span>
            <h2 className={styles.aiPanelTitle}>Instant Conceptual Guidance</h2>
          </div>
          <div className={styles.aiInputRow}>
            <input
              type="text"
              placeholder="Explain the intuition behind 'P vs NP' or ask a specific doubt..."
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSolve()}
              className={styles.aiInput}
            />
            <button onClick={handleAiSolve} disabled={isAiSolving} className={styles.aiSolveBtn}>
              {isAiSolving ? 'Synthesizing...' : 'Solve with AI'}
            </button>
          </div>
          {aiResponse && (
            <div className={styles.aiResult}>
              <h3>Logical Breakdown</h3>
              <p>{aiResponse.explanation}</p>
              {aiResponse.steps?.length > 0 && (
                <ol className={styles.aiSteps}>
                  {aiResponse.steps.map((step: string, i: number) => (
                    <li key={i}><span className={styles.stepNum}>{i + 1}</span> {step}</li>
                  ))}
                </ol>
              )}
              <div className={styles.aiFooter}>
                <span>Not satisfied? Let the community help.</span>
                <button onClick={handlePostToCommunity} className={styles.postCommunityBtn}>Post to Community</button>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search doubts by title or content..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.searchInput}
            />
            {searchInput && (
              <button className={styles.searchClear} onClick={() => { setSearchInput(''); setSearchQuery(''); }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className={styles.filters}>
          <div className={styles.subjectPills}>
            <button onClick={() => setActiveSubject(null)} className={`${styles.subjectBtn} ${!activeSubject ? styles.active : ''}`}>All Subjects</button>
            {subjects.map(s => (
              <button key={s.id} onClick={() => setActiveSubject(s.id)} className={`${styles.subjectBtn} ${activeSubject === s.id ? styles.active : ''}`}>{s.name}</button>
            ))}
          </div>
          <div className={styles.filterToggle}>
            {filterButtons.map(({ key, label }) => (
              <button key={key} onClick={() => setFilterType(key)} className={`${styles.toggleBtn} ${filterType === key ? styles.active : ''}`}>{label}</button>
            ))}
            <button onClick={() => setIsModalOpen(true)} className="sb-btnPrimary" style={{ whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}>Ask Community</button>
          </div>
        </div>

        {/* Doubts Grid */}
        {loading ? (
          <div className={styles.grid}>{[1,2,3,4,5,6].map(i => <DoubtCardSkeleton key={i} />)}</div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={() => loadDoubts(true)} className="sb-btnPrimary" style={{ marginTop: 16 }}>Retry</button>
          </div>
        ) : doubts.length > 0 ? (
          <div className={styles.grid}>
            {doubts.map((doubt) => (
              <Link key={doubt.id} href={`/doubts/${doubt.id}`} className={styles.doubtCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.subjectLabel}>{doubt.subjects?.name || 'General'}</span>
                  {doubt.status === 'resolved' && <span className={styles.solvedBadge}>Solved</span>}
                  <span className={styles.voteBadge}>{doubt.votes ?? 0} votes</span>
                </div>
                <h3 className={styles.doubtTitle}>{doubt.title}</h3>
                <p className={styles.doubtPreview}>{doubt.content?.substring(0, 150)}...</p>
                <div className={styles.cardFooter}>
                  {doubt.profiles?.avatar_url
                    ? <img src={doubt.profiles.avatar_url} alt="" className={styles.authorAvatar} />
                    : <div className={styles.authorInitial}>{doubt.profiles?.username?.[0] || 'L'}</div>
                  }
                  <span className={styles.authorName}>{doubt.profiles?.username || 'Learner'}</span>
                  <span className={styles.cardDate}>{new Date(doubt.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="💬"
            title={searchQuery ? `No results for "${searchQuery}"` : 'No doubts yet'}
            description={searchQuery ? 'Try different keywords or clear the search.' : 'Be the first to ask!'}
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </div>

      <AskDoubtModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setPrefillQuestion(''); }}
        prefillContent={prefillQuestion}
        onPublished={() => loadDoubts(false)}
      />
    </>
  );
}
