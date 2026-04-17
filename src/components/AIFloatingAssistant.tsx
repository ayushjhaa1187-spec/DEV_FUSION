'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Mic, History, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function AIFloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role:'user'|'ai', content:string}[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sb_ai_history');
      return saved ? JSON.parse(saved) : [
        { role: 'ai', content: 'Academic challenges? Doubt solved. Insight earned. I\'m your SkillBridge AI tutor!' }
      ];
    }
    return [{ role: 'ai', content: 'Academic challenges? Doubt solved. Insight earned. I\'m your SkillBridge AI tutor!' }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('sb_ai_history', JSON.stringify(messages));
  }, [messages]);

  const clearHistory = () => {
    const defaultMsg = [{ role: 'ai' as const, content: 'Academic challenges? Doubt solved. Insight earned. I\'m your SkillBridge AI tutor!' }];
    setMessages(defaultMsg);
    localStorage.removeItem('sb_ai_history');
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim()) return;
    
    const userMsg = { role: 'user' as const, content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/ai/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend })
      });
      
      const resData = await res.json().catch(() => ({ success: false, error: 'Network parsing error' }));

      if (res.status === 401) {
        setMessages(prev => [...prev, { role: 'ai', content: '🔒 **Sign in required.** Please [sign in](/auth) to use the AI tutor.' }]);
        return;
      }
      
      if (res.status === 402) {
        setMessages(prev => [...prev, { role: 'ai', content: '🚀 **Free tier limit reached.** [Upgrade to Pro](/settings) for unlimited AI assistance!' }]);
        return;
      }

      if (!res.ok || !resData.success) {
        setMessages(prev => [...prev, { role: 'ai', content: resData.error || resData.message || 'The neural network encountered an error. Please retry.' }]);
        return;
      }

      // Add the AI message from response - handling structured output from ai-service
      const data = resData.data;
      let aiContent = '';
      
      if (!data) {
        aiContent = 'The AI engine returned an empty response. Please try clarifying your question.';
      } else if (typeof data === 'string') {
        aiContent = data;
      } else if (data.analysis || data.explanation) {
        aiContent = data.analysis || data.explanation;
        if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
          aiContent += '\n\n**Resolution Steps:**\n' + data.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n');
        }
      } else {
        aiContent = 'I processed your request but couldn\'t synthesize a structured answer. Please try again.';
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);
    } catch (err) {
      console.error('AI Fetch Error:', err);
      setMessages(prev => [...prev, { role: 'ai', content: '📡 Connection issue. Please check your internet and retry.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Explain P vs NP", 
    "Mastering React hooks", 
    "Show my test progress"
  ];

  return (
    <div className="ai-assistant-wrapper" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999 }}>
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="group relative" 
            onClick={() => setIsOpen(true)}
            style={{
              width: '64px', height: '64px', borderRadius: '24px', borderTopLeftRadius: '4px',
              background: 'linear-gradient(135deg, #7c3aed, #06d6a0)',
              color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(124, 58, 237, 0.4)',
            }}
          >
            <div className="absolute inset-0 rounded-[inherit] border-2 border-emerald-400 opacity-0 group-hover:animate-ping pointer-events-none" />
            <Sparkles size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 100, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="sb-glass"
            style={{
              width: '440px', height: '680px', maxHeight: '85vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: 'var(--shadow-premium)',
              position: 'absolute', bottom: '0', right: '0'
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="m-0 text-sm font-black tracking-tight font-heading">SkillBridge <span className="text-emerald-400">AI</span></h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Reasoning Engine v4</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearHistory} 
                  title="Clear History"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
                >
                  <RotateCcw size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={18} className="opacity-40" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
              {messages.map((m, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`${m.role === 'user' ? 'self-end bg-violet-600' : 'self-start bg-white/5 border border-white/10'} max-w-[90%] p-4 px-5 rounded-[24px] text-[0.95rem] leading-relaxed shadow-sm`}
                  style={{
                    borderBottomRightRadius: m.role === 'user' ? '4px' : '24px',
                    borderBottomLeftRadius: m.role === 'ai' ? '4px' : '24px',
                  }}
                >
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <p className="m-0">{children}</p>,
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <div className="rounded-xl overflow-hidden my-4 border border-white/10">
                            <SyntaxHighlighter
                              PreTag="div"
                              language={match[1]}
                              style={atomDark}
                              customStyle={{ margin: 0, background: '#09090b', padding: '1.25rem', fontSize: '0.8rem' }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-white/10 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[0.8rem]" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </motion.div>
              ))}
              {loading && (
                <div className="self-start bg-white/5 p-4 px-6 rounded-[24px] border border-white/10 flex gap-2">
                  {[0, 1, 2].map(dot => (
                    <motion.div 
                      key={dot}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1, delay: dot * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-violet-500"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/5 bg-white/5">
              <div className="flex flex-wrap gap-2 mb-4">
                {quickPrompts.map(p => (
                  <button 
                    key={p} 
                    onClick={() => sendMessage(p)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider opacity-60 hover:opacity-100 hover:bg-white/10 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Inquire with SkillBridge AI..."
                  className="sb-input !bg-black pr-14"
                />
                <button 
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="absolute right-1.5 top-1.5 w-11 h-11 bg-violet-600 rounded-xl flex items-center justify-center text-white disabled:opacity-40 shadow-lg shadow-violet-600/20 active:scale-95 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
