'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { doubtApi, answerApi } from '@/lib/api';
import ReputationBadge from '@/components/user/ReputationBadge';
import { Sparkles, MessageSquare, ChevronRight, ThumbsUp, ThumbsDown, CheckCircle2, Share2, Flag, ArrowLeft, Clock, Send, X, Brain } from 'lucide-react';
import { LoadingPage } from '@/components/ui/Loading';
import RichTextEditor from '@/components/ui/RichTextEditor';
import RichTextRenderer from '@/components/ui/RichTextRenderer';
import { aiApi } from '@/lib/api';
import LimitReachedModal from '@/components/modals/LimitReachedModal';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useSafeRealtime } from '@/hooks/useSafeRealtime';

export default function DoubtDetailPageClient({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [doubt, setDoubt] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [newAnswerJson, setNewAnswerJson] = useState<any>(null);
  const [newAnswerText, setNewAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usage, setUsage] = useState({ used: 0, total: 5 });

  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setErrorStatus(null);
      const doubtData = await doubtApi.getDoubt(id);
      
      const recsData = await fetch(`/api/doubts/${id}/recommendations`)
        .then(res => res.status === 200 ? res.json() : [])
        .catch(() => []);
      
      setDoubt(doubtData);
      setAnswers(doubtData.answers || []);
      setRecommendations(recsData || []);
    } catch (err: any) {
      console.error('Failed to load doubt details', err);
      // Try to extract status if available from API client
      setErrorStatus(err.status || 500);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    // Fetch initial usage
    if (user) {
      aiApi.getUsage().then(data => {
        if (data?.success && data.usages?.doubt_solve) {
          setUsage(data.usages.doubt_solve);
        }
      });
    }
  }, [fetchData, user]);

  // 🛰️ Real-time Answer Tracker
  // Injects new answers and updates status (accepted/votes) in real-time
  useSafeRealtime(
    `doubt-details-${id}`,
    [
      {
        event: 'INSERT',
        table: 'answers',
        filter: `doubt_id=eq.${id}`,
        handler: async (payload) => {
          console.log('[Realtime] New Answer Detected:', payload.new.id);
          // Fetch full profile info for the new answer
          const { data } = await supabase
            .from('answers')
            .select('*, profiles(username, avatar_url, reputation_points)')
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            setAnswers(prev => {
              if (prev.find(a => a.id === data.id)) return prev;
              return [...prev, data];
            });
            toast.success('New solution provided!', { icon: '💡' });
          }
        }
      },
      {
        event: 'UPDATE',
        table: 'answers',
        filter: `doubt_id=eq.${id}`,
        handler: (payload) => {
          console.log('[Realtime] Answer Updated:', payload.new.id);
          setAnswers(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
        }
      },
      {
        event: 'UPDATE',
        table: 'doubts',
        filter: `id=eq.${id}`,
        handler: (payload) => {
          console.log('[Realtime] Doubt Status Updated:', payload.new.status);
          setDoubt(prev => prev ? { ...prev, ...payload.new } : prev);
        }
      }
    ]
  );

  const handlePostAnswer = async () => {
    if (!newAnswerText.trim()) return;
    setPosting(true);
    try {
      await answerApi.postAnswer(id, { 
        content_markdown: newAnswerText 
      });
      setNewAnswerJson(null);
      setNewAnswerText('');
      fetchData();
    } catch (err) {
      console.error('Failed to post answer');
    } finally {
      setPosting(false);
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
      console.error('Failed to accept solution');
    }
  };

  const handleVote = async (answerId: string, type: 'up' | 'down') => {
    if (!user) { alert('Please sign in to vote'); return; }
    try {
      const { totalVotes, userVote } = await answerApi.vote(answerId, type);
      setAnswers(answers.map(a =>
        a.id === answerId ? { ...a, votes: totalVotes, user_vote: userVote } : a
      ));
    } catch (err) {
      console.error('Vote failed');
    }
  };
  
  const handleAiAnalyze = async () => {
    if (!user || !doubt) return;
    
    // 1. Pre-flight usage check
    try {
      const usageData = await aiApi.getUsage();
      if (usageData?.success && usageData.usages?.doubt_solve) {
        setUsage(usageData.usages.doubt_solve);
        if (usageData.usages.doubt_solve.used >= usageData.usages.doubt_solve.total) {
          setShowLimitModal(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Usage check failure', e);
    }

    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await aiApi.solveDoubt({
        title: doubt.title,
        content: doubt.content_markdown || doubt.content_text,
        subject: doubt.subjects?.name || 'General'
      });
      
      if (res.success) {
        setAiResponse(res.analysis);
        // Refresh usage after success
        const fresh = await aiApi.getUsage();
        if (fresh?.success && fresh.usages?.doubt_solve) {
          setUsage(fresh.usages.doubt_solve);
        }
      } else if (res.error?.includes('limit')) {
        setShowLimitModal(true);
      } else {
        throw new Error(res.error || 'AI Analysis failed');
      }
    } catch (err: any) {
      alert(err.message || 'Transmission failed. Ensure your neural link is stable.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingPage />;

  // Handle errors or missing doubt
  if (!doubt) {
    const is404 = errorStatus === 404;
    return (
      <div className="min-h-screen bg-[#06060c] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-gray-500 mb-8 border border-white/5">
          {is404 ? <X size={40} /> : <Flag size={40} className="text-indigo-400" />}
        </div>
        <h2 className="text-3xl font-black text-white mb-2">
          {is404 ? 'Doubt Not Found' : 'Synaptic Connection Error'}
        </h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          {is404 
            ? 'This record has been deleted or moved to a different sector.' 
            : 'We encountered an issue retrieving this doubt. Please ensure your neural link is stable and try again.'}
        </p>
        <div className="flex gap-4">
          <Link href="/doubts" className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition shadow-[0_10px_30px_rgba(99,102,241,0.2)]">
            Return to Feed
          </Link>
          {!is404 && (
             <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-2xl bg-white/5 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition border border-white/5">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === (doubt.author_id || doubt.user_id);
  const isResolved = doubt.status === 'resolved';

  return (
    <div className="min-h-screen bg-[#06060c] selection:bg-indigo-500/30">
      {/* Navigation Header */}
      <div className="sticky top-0 z-50 bg-[#06060c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </button>
          <div className="flex items-center gap-4">
             <button className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition">
              <Share2 size={16} />
            </button>
            <button className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition">
              <Flag size={16} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Question Section */}
        <section className="relative p-10 lg:p-14 rounded-[48px] bg-[#0c0c16] border border-white/5 mb-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          
          <div className="flex items-center gap-3 mb-10">
            <span className="px-4 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              {doubt.subjects?.name || 'General'}
            </span>
            {isResolved && (
              <span className="px-4 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={12} />
                Resolved
              </span>
            )}
            <div className="flex items-center gap-2 ml-auto text-gray-600 text-[10px] font-black uppercase tracking-widest">
              <Clock size={12} />
              {new Date(doubt.created_at).toLocaleDateString()}
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white mb-8 tracking-tight leading-[1.1]">
            {doubt.title}
          </h1>

          <div className="flex items-center gap-4 mb-12 pb-8 border-b border-white/5">
             {doubt.profiles?.avatar_url ? (
                <Image src={doubt.profiles.avatar_url} alt="Author avatar" width={48} height={48} loading="lazy" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/5" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white text-xs font-black ring-2 ring-white/5">
                  {doubt.profiles?.username?.[0] || 'L'}
                </div>
              )}
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tighter hover:text-indigo-400 transition cursor-pointer flex items-center gap-2">
                  {doubt.profiles?.username || 'Learner'}
                  {doubt.profiles?.reputation_points != null && (
                    <ReputationBadge points={doubt.profiles.reputation_points} />
                  )}
                </p>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                  Original Poster
                </p>
              </div>
          </div>

          <div className="mb-12">
            <RichTextRenderer content={doubt.content_markdown || doubt.content} />
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/5">
                <button onClick={() => handleVote(doubt.id, 'up')} className="px-6 py-3 rounded-xl text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/5 transition flex items-center gap-2">
                  <ThumbsUp size={16} />
                  <span className="text-xs font-black">{doubt.votes || 0}</span>
                </button>
                <div className="w-px h-6 bg-white/5" />
                <button onClick={() => handleVote(doubt.id, 'down')} className="px-6 py-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition">
                  <ThumbsDown size={16} />
                </button>
             </div>

             <button 
                onClick={handleAiAnalyze}
                disabled={aiLoading}
                className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition group disabled:opacity-50"
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">Immediate AI Analysis</span>
              </button>
          </div>
        </section>

        {/* AI Response Display */}
        <AnimatePresence>
          {aiResponse && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 mb-12 p-10 rounded-[40px] bg-indigo-500/5 border border-indigo-500/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Brain size={120} />
              </div>
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg">
                   <Sparkles size={20} />
                 </div>
                 <div>
                   <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">AI Conceptual Breakdown</h4>
                   <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Generated via Gemini 1.5 Flash</p>
                 </div>
                 <button 
                   onClick={() => setAiResponse(null)}
                   className="ml-auto text-gray-600 hover:text-white transition"
                 >
                   <X size={18} />
                 </button>
              </div>
              <div className="prose prose-invert prose-indigo max-w-none">
                 <RichTextRenderer content={aiResponse} />
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                 * Verified by SkillBridge AI Engine. Information should be cross-referenced with syllabus.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answers Section */}
        <div className="space-y-12">
          <div className="flex items-center justify-between px-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <MessageSquare size={24} className="text-indigo-500" />
              {answers.length} Responses
            </h2>
            <div className="h-px flex-1 mx-8 bg-white/5" />
          </div>

          {answers.length === 0 ? (
            <div className="py-20 text-center bg-white/5 rounded-[48px] border border-dashed border-white/10">
              <p className="text-gray-500 font-medium">Be the first to share your knowledge.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {answers
                .sort((a, b) => (b.is_accepted ? 1 : 0) - (a.is_accepted ? 1 : 0))
                .map((answer) => (
                <div 
                  key={answer.id} 
                  className={`relative p-10 rounded-[48px] border transition-all duration-300 ${
                    answer.is_accepted 
                      ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_20px_40px_rgba(16,185,129,0.05)]' 
                      : 'bg-[#0c0c16] border-white/5'
                  }`}
                >
                  {answer.is_accepted && (
                    <div className="absolute top-8 right-10 px-4 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={12} />
                      Solution Recognized
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-8">
                     {answer.profiles?.avatar_url ? (
                        <Image src={answer.profiles.avatar_url} alt="Responder avatar" width={40} height={40} loading="lazy" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white/5" />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 text-[10px] font-black">
                          {answer.profiles?.username?.[0] || 'S'}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-tighter flex items-center gap-2">
                          {answer.profiles?.username || 'Learner'}
                          {answer.profiles?.reputation_points != null && (
                            <ReputationBadge points={answer.profiles.reputation_points} />
                          )}
                        </p>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                          {new Date(answer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                  </div>

                  <div className="mb-10">
                    <RichTextRenderer content={answer.content_markdown || answer.content} />
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button onClick={() => handleVote(answer.id, 'up')} className={`px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${answer.user_vote === 'up' ? 'text-emerald-400 bg-emerald-400/5' : 'text-gray-500 hover:text-emerald-400'}`}>
                          <ThumbsUp size={14} />
                          <span className="text-[10px] font-black">{answer.votes || 0}</span>
                        </button>
                        <div className="w-px h-5 bg-white/5" />
                        <button onClick={() => handleVote(answer.id, 'down')} className={`px-5 py-2.5 rounded-xl transition ${answer.user_vote === 'down' ? 'text-red-400 bg-red-400/5' : 'text-gray-500 hover:text-red-400'}`}>
                          <ThumbsDown size={14} />
                        </button>
                     </div>

                     {isAuthor && !answer.is_accepted && !isResolved && (
                        <button
                          onClick={() => handleAcceptAnswer(answer.id)}
                          className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition flex items-center gap-2"
                        >
                          <CheckCircle2 size={14} />
                          Accept Solution
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Section */}
        <section className="mt-20">
          <div className="p-10 lg:p-14 rounded-[48px] bg-gradient-to-b from-white/5 to-transparent border border-white/5">
             <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <Send size={20} className="text-indigo-500" />
              Contribute
            </h3>
            
            {user ? (
              <div className="space-y-8">
                <RichTextEditor
                  content={newAnswerJson}
                  onChange={(json, text) => {
                    setNewAnswerJson(json);
                    setNewAnswerText(text);
                  }}
                  placeholder="Elaborate on your solution or share a conceptual breakdown..."
                />
                <button
                  onClick={handlePostAnswer}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition shadow-[0_20px_40px_rgba(99,102,241,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
                  disabled={posting || !newAnswerText.trim()}
                >
                  {posting ? 'Transmitting Knowledge...' : (
                    <span className="flex items-center justify-center gap-2">
                       Submit Answer
                       <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-12 px-8 rounded-3xl bg-indigo-600/5 border border-indigo-500/10">
                <p className="text-indigo-400 font-bold mb-4 uppercase text-[10px] tracking-widest">Authentication Required</p>
                <p className="text-gray-500 text-sm mb-6">Join the SkillBridge community to contribute your expertise.</p>
                <Link href="/auth" className="inline-block px-8 py-3 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition">
                  Sign In to Answer
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <LimitReachedModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        used={usage.used}
        total={usage.total}
        title="Analysis Quota Reached"
        description="Your daily allocation for high-bandwidth conceptual analysis has been synchronized. Upgrade to unlock unrestricted synaptic resolution."
      />
    </div>
  );
}
