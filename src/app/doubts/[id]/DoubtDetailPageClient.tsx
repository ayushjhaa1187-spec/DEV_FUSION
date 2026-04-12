'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { doubtApi, answerApi } from '@/lib/api';
import ReputationBadge from '@/components/user/ReputationBadge';
import { Sparkles, MessageSquare, ChevronRight, ThumbsUp, ThumbsDown, CheckCircle2, Share2, Flag, ArrowLeft, Clock, Send, X } from 'lucide-react';
import { LoadingPage } from '@/components/ui/Loading';
import RichTextEditor from '@/components/ui/RichTextEditor';
import RichTextRenderer from '@/components/ui/RichTextRenderer';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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

  const fetchData = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`answers-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'answers',
        filter: `doubt_id=eq.${id}`
      }, () => fetchData())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'answers',
        filter: `doubt_id=eq.${id}`
      }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, fetchData]);

  const handlePostAnswer = async () => {
    if (!newAnswerText.trim()) return;
    setPosting(true);
    try {
      await answerApi.postAnswer(id, { 
        content: newAnswerJson,
        content_text: newAnswerText 
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
      const { totalVotes } = await answerApi.vote(answerId, type);
      setAnswers(answers.map(a =>
        a.id === answerId ? { ...a, votes: totalVotes, user_vote: type } : a
      ));
    } catch (err) {
      console.error('Vote failed');
    }
  };

  if (loading) return <LoadingPage />;
  if (!doubt) return (
    <div className="min-h-screen bg-[#06060c] flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-gray-500 mb-8">
        <X size={40} />
      </div>
      <h2 className="text-3xl font-black text-white mb-2">Doubt Not Found</h2>
      <p className="text-gray-500 mb-8">This synaptic record has been deleted or moved.</p>
      <Link href="/doubts" className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition shadow-[0_10px_30px_rgba(99,102,241,0.2)]">
        Return to Feed
      </Link>
    </div>
  );

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
                <img src={doubt.profiles.avatar_url} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/5" />
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
            <RichTextRenderer content={doubt.content_jsonb || doubt.content} />
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
          </div>
        </section>

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
                        <img src={answer.profiles.avatar_url} alt="" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white/5" />
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
                    <RichTextRenderer content={answer.content_jsonb || answer.content} />
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
    </div>
  );
}
