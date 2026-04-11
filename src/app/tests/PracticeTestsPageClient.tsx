'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { testApi, subjectApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './tests.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Lock, ArrowRight, Timer, 
  ChevronRight, Trophy, Sparkles, BookOpen, 
  Target, BarChart3, AlertCircle, CheckCircle2,
  Clock, History as HistoryIcon, Layout, Filter, X
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

type TestView = 'selection' | 'generating' | 'taking' | 'result';

export default function PracticeTestsPageClient() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State
  const [view, setView] = useState<TestView>('selection');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [filterSubjectId, setFilterSubjectId] = useState('all');
  
  // Active Test State
  const [test, setTest] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Data
  useEffect(() => {
    if (user) {
      subjectApi.getSubjects().then(setSubjects);
      testApi.getHistory().then(setHistory);
    }
  }, [user]);

  // Timer Logic
  useEffect(() => {
    if (view === 'taking' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view, timeLeft]);

  const handleAutoSubmit = useCallback(() => {
    if (isSubmitting) return;
    performSubmit();
  }, [isSubmitting]);

  const performSubmit = async () => {
    if (!attempt || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const data = await testApi.submit(attempt.id);
      setLastResult(data);
      setView('result');
      testApi.getHistory().then(setHistory);
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAndStart = async () => {
    if (!selectedSubjectId || !topic) return;
    setView('generating');
    try {
      // 1. Generate Questions
      const testData = await testApi.generate({ subject_id: selectedSubjectId, topic });
      setTest(testData);
      
      // 2. Initial Attempt
      const startData = await testApi.start(testData.id);
      setAttempt(startData.attempt);
      
      // 3. Setup taking state
      const endsAt = new Date(startData.attempt.ends_at).getTime();
      const now = new Date().getTime();
      setTimeLeft(Math.max(0, Math.floor((endsAt - now) / 1000)));
      setAnswers({});
      setCurrentQuestionIdx(0);
      setView('taking');
    } catch (err: any) {
      alert(err.message || 'Generation failed');
      setView('selection');
    }
  };

  const selectAnswer = async (questionId: string, index: number) => {
    if (view !== 'taking') return;
    const prevAnswer = answers[questionId];
    setAnswers(prev => ({ ...prev, [questionId]: index }));
    
    try {
      await testApi.saveAnswer({
        attempt_id: attempt.id,
        question_id: questionId,
        selected_index: index
      });
    } catch (err) {
      // Rollback if save failed (optional, depends on UX)
      console.warn('Silent save failed', err);
    }
  };

  // UI Helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className="flex flex-col items-center justify-center text-center py-20 px-6">
           <div className="mb-8 p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20">
              <BrainCircuit className="w-16 h-16 text-indigo-400" />
           </div>
           <h1 className="text-5xl font-extrabold text-white mb-4">AI Practice <span className="text-indigo-500">Engine</span></h1>
           <p className="text-xl text-gray-400 max-w-xl mb-10 leading-relaxed">
             Unlock world-class academic assessments tailored specifically to your weak points using Gemini 1.5 Flash.
           </p>
           <Link href="/auth" className="flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all hover:scale-105">
             Unlock Now <ArrowRight size={20} />
           </Link>
        </div>
      </div>
    );
  }

  const filteredHistory = history.filter(h => 
    filterSubjectId === 'all' || h.subject_id === filterSubjectId
  );

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        
        {/* VIEW: SELECTION & HISTORY */}
        {view === 'selection' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-extrabold text-white mb-2">Practice <span className="text-indigo-400">Hub</span></h1>
                <p className="text-gray-400 max-w-xl">Configure your session or review your academic trajectory.</p>
              </div>
              <div className="flex gap-4">
                 <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-bold transition-all">
                    <HistoryIcon size={16} /> History
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5">
                <div className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Sparkles size={120} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    <Target className="text-indigo-400" /> New Assessment
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Academic Subject</label>
                      <select 
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select a subject...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Target Topic</label>
                      <input 
                        type="text"
                        placeholder="e.g. Memory Management or Thermodynamics"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>

                    <button 
                      onClick={handleGenerateAndStart}
                      disabled={!selectedSubjectId || !topic}
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-extrabold py-5 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3"
                    >
                      Initialize AI Engine <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-8">
                 <div className="p-8 rounded-[40px] bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xl font-bold text-white flex items-center gap-3">
                         <BarChart3 className="text-emerald-400" /> Score Trajectory
                       </h3>
                       <select 
                          className="bg-transparent text-xs font-bold text-gray-400 border-none outline-none cursor-pointer hover:text-white"
                          value={filterSubjectId}
                          onChange={(e) => setFilterSubjectId(e.target.value)}
                       >
                          <option value="all">All Subjects</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>

                    <div className="h-[240px] w-full">
                       {filteredHistory.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredHistory.slice(0, 7).reverse()}>
                               <defs>
                                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                               <XAxis dataKey="topic" hide />
                               <YAxis domain={[0, 100]} hide />
                               <Tooltip 
                                  contentStyle={{ background: '#1e1e3f', borderRadius: '16px', border: '1px solid #ffffff10' }}
                                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                               />
                               <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                            </AreaChart>
                         </ResponsiveContainer>
                       ) : (
                         <div className="h-full flex flex-col items-center justify-center text-gray-600 italic text-sm">
                            <HistoryIcon className="mb-2 opacity-20" size={40} />
                            No data points found yet.
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
               <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500">Recent Activity</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHistory.slice(0, 6).map((h) => (

                    <Link href={`/tests/${h.test_id}/results`} key={h.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all group relative overflow-hidden">
                       <div className="flex justify-between items-start mb-4">
                          <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-full uppercase">
                             {h.practice_tests?.subjects?.name}
                          </div>
                          <div className="text-2xl font-black text-white">{h.score}%</div>
                       </div>
                       <h5 className="text-lg font-bold text-white mb-2 truncate">{h.practice_tests?.topic}</h5>
                       <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                          <Clock size={12} /> {new Date(h.started_at).toLocaleDateString()}
                       </div>
                       <ChevronRight className="absolute bottom-6 right-6 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                    </Link>
                  ))}
                  {history.length === 0 && Array.from({length: 3}).map((_, i) => <Skeleton key={i} height="120px" rounded />)}
               </div>
            </div>
          </motion.div>
        )}

        {/* VIEW: GENERATING */}
        {view === 'generating' && (
          <motion.div 
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-40 text-center"
          >
             <div className="relative mb-12">
                <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <BrainCircuit className="text-indigo-500 animate-pulse" size={32} />
                </div>
             </div>
             <h2 className="text-3xl font-extrabold text-white mb-4">Synthesizing Your Assessment</h2>
             <p className="text-gray-400 max-w-sm">SkillBridge AI is analyzing academic parameters for <strong className="text-indigo-400">{topic}</strong>...</p>
          </motion.div>
        )}

        {/* VIEW: TAKING TEST */}
        {view === 'taking' && test && (
          <motion.div 
            key="taking"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* STICKY HEADER */}
            <div className="sticky top-20 z-20 bg-[#0a0a14]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black">
                    {currentQuestionIdx + 1}
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-white leading-tight">{test.topic}</h2>
                    <p className="text-xs text-gray-500">Progress: {Math.round(((currentQuestionIdx + 1) / test.questions.length) * 100)}%</p>
                 </div>
              </div>

              <div className={`p-3 px-6 rounded-2xl border ${timeLeft < 60 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/10 text-white'} flex items-center gap-3 font-mono font-bold text-xl`}>
                 <Timer size={20} className={timeLeft < 60 ? 'animate-pulse' : ''} />
                 {formatTime(timeLeft)}
              </div>
            </div>

            {/* QUESTION BOX */}
            <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BookOpen size={100} />
               </div>
               
               <p className="text-2xl font-medium text-white mb-12 leading-relaxed">
                 {test.questions[currentQuestionIdx].question_text}
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.questions[currentQuestionIdx].options.map((opt: string, i: number) => {
                    const questionId = test.questions[currentQuestionIdx].id;
                    const isSelected = answers[questionId] === i;
                    
                    return (
                      <button 
                         key={i}
                         onClick={() => selectAnswer(questionId, i)}
                         className={`p-6 rounded-3xl border text-left transition-all flex items-center gap-4 ${
                           isSelected 
                           ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                           : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                         }`}
                      >
                         <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-600'}`}>
                           {String.fromCharCode(65 + i)}
                         </div>
                         <span className="font-semibold text-sm">{opt}</span>
                      </button>
                    );
                  })}
               </div>
            </div>

            {/* NAVIGATION FOOTER */}
            <div className="flex items-center justify-between">
               <div className="flex gap-4">
                  <button 
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                    className="p-4 px-8 bg-white/5 hover:bg-white/10 disabled:opacity-20 border border-white/10 rounded-2xl text-white font-bold transition-all text-sm"
                  >Previous</button>
                  <button 
                    disabled={currentQuestionIdx === test.questions.length - 1}
                    onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                    className="p-4 px-8 bg-white/5 hover:bg-white/10 disabled:opacity-20 border border-white/10 rounded-2xl text-white font-bold transition-all text-sm"
                  >Next</button>
               </div>

               <button 
                 onClick={performSubmit}
                 disabled={isSubmitting}
                 className="p-4 px-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-3"
               >
                 {isSubmitting ? 'Evaluating...' : 'Finish & Submit'} <ArrowRight size={18} />
               </button>
            </div>
          </motion.div>
        )}

        {/* VIEW: RESULT SUMMARY */}
        {view === 'result' && lastResult && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-8"
          >
             <div className="relative mb-4">
                <div className="w-48 h-48 rounded-full border-[10px] border-white/5 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500/10 to-transparent">
                   <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-1">Final Score</div>
                   <div className="text-6xl font-black text-white">{lastResult.score}%</div>
                </div>
                {lastResult.score >= 70 && (
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce">
                    <Trophy size={24} />
                  </div>
                )}
             </div>

             <div>
                <h2 className="text-4xl font-extrabold text-white mb-3">
                  {lastResult.score >= 80 ? 'Exceptional Performance!' : lastResult.score >= 50 ? 'Strong Foundation!' : 'Practice Makes Perfect!'}
                </h2>
                <p className="text-gray-400 max-w-sm mb-10">
                  You answered <strong className="text-indigo-400">{lastResult.correct} questions</strong> correctly. Continue your trajectory to achieve mastery.
                </p>
             </div>

             <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                <Link 
                  href={`/tests/${test.id}/results`}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all"
                >
                  <Layout size={18} /> Detailed Review
                </Link>
                <button 
                  onClick={() => setView('selection')}
                  className="flex-1 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  New Session
                </button>
             </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

