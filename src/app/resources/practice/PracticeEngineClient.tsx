"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Play, Search, Clock, CheckCircle, XCircle, Trophy, BarChart3, ArrowLeft } from 'lucide-react';

type TestState = 'BANK' | 'LOADING' | 'ACTIVE' | 'RESULTS' | 'HISTORY';

interface BankRecord {
    topic: string;
    total_questions: number;
}

export default function PracticeEngineClient() {
    const [state, setState] = useState<TestState>('BANK');
    const [bank, setBank] = useState<Record<string, BankRecord[]>>({});
    const [history, setHistory] = useState<any[]>([]);
    
    // Test Config
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [durationMinutes] = useState(15);
    
    // Active Test State
    const [attemptId, setAttemptId] = useState('');
    const [questions, setQuestions] = useState<any[]>([]);
    const [startedAt, setStartedAt] = useState('');
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    
    // Results State
    const [result, setResult] = useState<any>(null);

    // Fetch Bank on load
    useEffect(() => {
        fetch('/api/tests/bank')
            .then(res => res.json())
            .then(data => {
                if (data.success) setBank(data.bank);
            })
            .catch(err => console.error("Failed to load bank:", err));
    }, []);

    const fetchHistory = async () => {
        setState('LOADING');
        try {
            const res = await fetch('/api/tests/history');
            const data = await res.json();
            if (data.success) {
                setHistory(data.history);
                setState('HISTORY');
            } else {
                setState('BANK');
            }
        } catch {
            setState('BANK');
        }
    };

    // Timer logic based on server started_at
    useEffect(() => {
        if (state !== 'ACTIVE' || !startedAt) return;
        
        const end = new Date(startedAt).getTime() + (durationMinutes * 60 * 1000);
        
        const tick = () => {
            const now = new Date().getTime();
            const remaining = Math.max(0, Math.floor((end - now) / 1000));
            setTimeLeft(remaining);
            
            if (remaining <= 0) {
                handleSubmit(true); // auto-submit
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [state, startedAt]);

    const handleStartTest = async () => {
        if (!subject || !topic) return;
        setState('LOADING');
        
        try {
            const res = await fetch('/api/tests/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, topic, questionCount: 5 })
            });
            const data = await res.json();
            
            if (data.success) {
                setAttemptId(data.attempt_id);
                setStartedAt(data.started_at);
                setQuestions(data.questions);
                setAnswers({});
                setState('ACTIVE');
            } else {
                alert(data.error || 'Failed to start test');
                setState('BANK');
            }
        } catch (err) {
            alert('Failed to contact server');
            setState('BANK');
        }
    };

    const handleSubmit = async (isAuto = false) => {
        // Stop timer immediately by shifting state
        setState('LOADING'); 
        
        const formattedAnswers = Object.entries(answers).map(([q_id, idx]) => ({
            question_id: q_id,
            selected_index: idx
        }));

        try {
            const res = await fetch('/api/tests/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attempt_id: attemptId,
                    answers: formattedAnswers,
                    is_auto_submit: isAuto
                })
            });
            const data = await res.json();
            
            if (data.success) {
                setResult(data);
                setState('RESULTS');
            } else {
                alert(data.error || 'Failed to submit test');
                setState('BANK');
            }
        } catch (err) {
            alert('Submission failed');
            setState('BANK');
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // View A: Bank
    if (state === 'BANK') {
        const subjectsList = Object.keys(bank);
        
        return (
            <div className="max-w-4xl mx-auto py-12">
                <header className="mb-10 text-center relative">
                    <button onClick={fetchHistory} className="absolute right-0 top-0 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                        <BarChart3 size={16} /> Score History
                    </button>
                    <h1 className="text-4xl md:text-5xl font-black text-rose-500 mb-4 flex items-center justify-center gap-3">
                        <Bot size={40} /> AI Practice Bank
                    </h1>
                    <p className="text-gray-400">Select a topic from the global cache, or generate a new one via AI.</p>
                </header>

                <div className="bg-white/5 border border-white/10 p-8 rounded-[30px]">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">Subject</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-lg focus:border-rose-500 transition-all outline-none text-white" 
                            placeholder="e.g. Machine Learning"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            list="subject-list"
                        />
                        <datalist id="subject-list">
                            {subjectsList.map(s => <option key={s} value={s} />)}
                        </datalist>
                    </div>

                    <div className="mb-10">
                        <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">Topic</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-lg focus:border-rose-500 transition-all outline-none text-white" 
                            placeholder="e.g. Neural Networks"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            list="topic-list"
                        />
                        <datalist id="topic-list">
                            {subject && bank[subject]?.map(t => <option key={t.topic} value={t.topic} />)}
                        </datalist>
                    </div>

                    <button 
                        onClick={handleStartTest}
                        disabled={!subject || !topic}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Play size={24} /> Generate & Start Test
                    </button>
                    
                     <div className="mt-8 pt-8 border-t border-white/10">
                        <h3 className="text-rose-400 font-bold mb-4 flex items-center gap-2"><Trophy size={18} /> Global Cache Available</h3>
                         {subjectsList.length === 0 ? <p className="text-gray-500 text-sm">Cache is empty. Be the first to generate a test!</p> : (
                             <div className="flex flex-wrap gap-2">
                                 {subjectsList.map(s => (
                                     <span key={s} onClick={() => setSubject(s)} className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-full text-sm font-bold cursor-pointer hover:bg-rose-500/20 transition-all">
                                         {s} ({bank[s].length} topics)
                                     </span>
                                 ))}
                             </div>
                         )}
                    </div>
                </div>
            </div>
        );
    }

    // View: Loading
    if (state === 'LOADING') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-8" />
                <h2 className="text-3xl font-black text-rose-500 mb-2">Connecting to Knowledge Base...</h2>
                <p className="text-gray-400 text-lg">If this topic is new, the AI is drafting your questions. Please wait.</p>
            </div>
        );
    }

    // View: History
    if (state === 'HISTORY') {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <BarChart3 className="text-rose-500" /> Score History
                    </h2>
                    <button 
                        onClick={() => setState('BANK')} 
                        className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-white font-bold transition-all"
                    >
                        Back to Bank
                    </button>
                </div>
                
                {history.length === 0 ? (
                    <div className="text-center p-12 bg-white/5 rounded-3xl border border-white/10">
                        <p className="text-gray-400 text-lg">No past attempts found. Take your first test!</p>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-black/40 text-rose-400">
                                <tr>
                                    <th className="p-4 font-bold">Subject</th>
                                    <th className="p-4 font-bold">Topic</th>
                                    <th className="p-4 font-bold">Score</th>
                                    <th className="p-4 font-bold">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history.map((h, i) => (
                                    <tr key={h.attempt_id || i} className="hover:bg-white/5 transition-all text-gray-200">
                                        <td className="p-4">{h.subject}</td>
                                        <td className="p-4">{h.topic}</td>
                                        <td className="p-4 font-black">
                                            <span className={h.score / h.total_questions >= 0.5 ? 'text-green-400' : 'text-red-400'}>
                                                {h.score} / {h.total_questions}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(h.completed_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    // View B: Active Test
    if (state === 'ACTIVE') {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="flex items-center justify-between bg-black/40 border border-white/10 p-6 rounded-3xl mb-8 sticky top-4 z-50 backdrop-blur-xl">
                    <div>
                        <h2 className="text-2xl font-black text-white">{subject}</h2>
                        <p className="text-rose-400 font-bold">{topic}</p>
                    </div>
                    <div className={`flex items-center gap-2 text-2xl font-black px-6 py-3 rounded-2xl ${timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>
                        <Clock size={24} /> {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="space-y-8">
                    {questions.map((q, qIndex) => (
                        <div key={q.id} className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                            <h3 className="text-xl font-bold text-white mb-6 leading-relaxed">
                                <span className="text-rose-500 mr-2">{qIndex + 1}.</span> 
                                {q.question_text}
                            </h3>
                            <div className="space-y-3">
                                {q.options.map((opt: string, optIndex: number) => {
                                    const isSelected = answers[q.id] === optIndex;
                                    return (
                                        <div 
                                            key={optIndex}
                                            onClick={() => setAnswers(prev => ({...prev, [q.id]: optIndex}))}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isSelected ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 hover:border-white/30 bg-black/40'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-rose-500' : 'border-gray-500'}`}>
                                                {isSelected && <div className="w-3 h-3 bg-rose-500 rounded-full" />}
                                            </div>
                                            <span className="text-lg text-gray-200">{opt}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button 
                        onClick={() => handleSubmit(false)}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-16 py-6 rounded-2xl font-black text-xl transition-all shadow-xl shadow-rose-600/20"
                    >
                        Submit Test
                    </button>
                    <p className="mt-4 text-gray-500 text-sm">Timer auto-submits when it hits 00:00</p>
                </div>
            </div>
        );
    }

    // View C: Results
    if (state === 'RESULTS' && result) {
        const percentage = Math.round((result.score / result.total_questions) * 100);
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="bg-gradient-to-br from-rose-900/40 to-black border border-rose-500/20 rounded-[40px] p-12 text-center mb-12">
                    <Trophy size={64} className="mx-auto text-rose-500 mb-6" />
                    <h2 className="text-5xl font-black text-white mb-4">Test Completed</h2>
                    <div className="text-8xl font-black text-rose-500 tabular-nums">
                        {percentage}%
                    </div>
                    <p className="text-2xl font-bold text-gray-300 mt-4">
                        You scored {result.score} out of {result.total_questions}
                    </p>
                </div>

                <div className="space-y-8">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <BarChart3 className="text-rose-500" /> Answer Review
                    </h3>
                    {questions.map((q, qIndex) => {
                        const correctIndex = result.correct_answers[q.id];
                        const userIndex = answers[q.id];
                        const gotItRight = correctIndex === userIndex;
                        
                        return (
                            <div key={q.id} className={`p-8 rounded-3xl border-2 ${gotItRight ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                                <h3 className="text-xl font-bold text-white mb-6">
                                    {qIndex + 1}. {q.question_text}
                                </h3>
                                <div className="space-y-3">
                                    {q.options.map((opt: string, optIndex: number) => {
                                        let highlightClass = "border-white/10 bg-black/40 text-gray-400";
                                        let icon = null;
                                        
                                        if (optIndex === correctIndex) {
                                            highlightClass = "border-green-500 bg-green-500/20 text-green-100 font-bold";
                                            icon = <CheckCircle size={20} className="text-green-500" />;
                                        } else if (optIndex === userIndex && !gotItRight) {
                                            highlightClass = "border-red-500 bg-red-500/20 text-red-100 line-through";
                                            icon = <XCircle size={20} className="text-red-500" />;
                                        }

                                        return (
                                            <div key={optIndex} className={`p-4 rounded-xl border flex items-center gap-3 ${highlightClass}`}>
                                                {icon || <div className="w-5" />}
                                                {opt}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-12 text-center">
                    <button 
                        onClick={() => { setState('BANK'); setSubject(''); setTopic(''); }}
                        className="bg-white/10 hover:bg-white/20 text-white px-12 py-4 rounded-xl font-bold transition-all flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={18} /> Back to Global Bank
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
