'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, CheckCircle2, MessageCircle } from 'lucide-react';

interface AISolverPanelProps {
  isOpen: boolean;
  onClose: () => void;
  doubtTitle: string;
  doubtContent: any;
  onFinished: (helped: boolean) => void;
}

export default function AISolverPanel({ isOpen, onClose, doubtTitle, doubtContent, onFinished }: AISolverPanelProps) {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !response && !isLoading) {
      handleSolve();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response]);

  const handleSolve = async () => {
    setIsLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/ai/solve-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: doubtTitle, content: doubtContent }),
      });

      if (!res.body) throw new Error('No readable stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        setResponse((prev) => prev + chunkValue);
      }
      setIsFinished(true);
    } catch (error) {
      console.error('AI Solving error:', error);
      setResponse('I encountered an error trying to process your doubt. Please try again or post to the community.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-[#0f0f1b] border-l border-white/10 z-[101] flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#13132b]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">AI Conceptual Solver</h3>
                  <p className="text-[10px] text-gray-500 font-bold">Step-by-step logical breakdown</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 transition">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="user-doubt-preview p-6 bg-white/5 rounded-3xl border border-white/5 mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2 block">Your Question</span>
                <h4 className="text-white font-bold text-lg mb-2">{doubtTitle}</h4>
                <div className="text-gray-400 text-sm line-clamp-2 italic">
                  Analyzing your context for pedagogical insights...
                </div>
              </div>

              <div className="ai-response-container">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Synthesizing Explanation</span>
                </div>

                <div className="text-gray-300 leading-relaxed space-y-4 font-medium">
                  {response.split('\n').map((line, i) => {
                    // Simple markdown-ish bold handling
                    const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    if (!line.trim()) return <br key={i} />;
                    return (
                      <p 
                        key={i} 
                        dangerouslySetInnerHTML={{ __html: cleanLine }} 
                        className={line.match(/^\d+./) ? 'pl-4 border-l-2 border-indigo-500/30' : ''}
                      />
                    );
                  })}
                </div>

                {isLoading && (
                  <div className="flex gap-1 mt-4">
                    <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-white/10 bg-[#13132b]">
              <AnimatePresence>
                {isFinished && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <button
                      onClick={() => onFinished(true)}
                      className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition group"
                    >
                      <CheckCircle2 size={24} className="text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-500">That helped, never mind</span>
                    </button>
                    <button
                      onClick={() => onFinished(false)}
                      className="flex flex-col items-center gap-2 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/20 transition group"
                    >
                      <MessageCircle size={24} className="text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-400">Still confused, post community</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              {!isFinished && (
                <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-600 animate-pulse">
                  AI is thinking... please wait
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
