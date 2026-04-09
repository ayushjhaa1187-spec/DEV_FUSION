'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Mic, History, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function AIFloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role:'user'|'ai', content:string}[]>([
    { role: 'ai', content: 'Academic challenges? Doubt solved. Insight earned. I\'m your SkillBridge AI tutor!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const data = await res.json();
      
      const aiContent = data.explanation 
        ? `${data.explanation}\n\n${(data.steps || []).join('\n')}`
        : data.error || 'The neural network encountered a slight latency. Please retry.';
        
      setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection fragmented. Please re-engage.' }]);
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
            whileHover={{ scale: 1.1 }}
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
            {/* Pulsing Ring (Phase 2.4) */}
            <div className="absolute inset-0 rounded-[inherit] border-2 border-emerald-400 opacity-0 group-hover:animate-ping pointer-events-none" />
            <Sparkles size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="ai-panel glass"
            style={{
              width: '440px', height: '680px', maxHeight: '85vh',
              background: 'rgba(9, 9, 15, 0.9)', backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '-20px 20px 80px rgba(0,0,0,0.8)',
              position: 'absolute', bottom: '0', right: '0'
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color="white" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>SkillBridge <span>AI</span></h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thinking Realtime</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    style={{ 
                      padding: '16px 20px',
                      borderRadius: '24px',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      background: m.role === 'user' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                      color: 'white',
                      borderBottomRightRadius: m.role === 'user' ? '4px' : '24px',
                      borderBottomLeftRadius: m.role === 'ai' ? '4px' : '24px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <div className="rounded-xl overflow-hidden my-4">
                              <SyntaxHighlighter
                                PreTag="div"
                                language={match[1]}
                                style={atomDark}
                                customStyle={{ margin: 0, background: '#000' }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </motion.div>
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: '24px', display: 'flex', gap: '6px' }}>
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {quickPrompts.map(p => (
                  <button 
                    key={p} 
                    onClick={() => sendMessage(p)}
                    style={{ padding: '8px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Inquire with SkillBridge AI..."
                  style={{ width: '100%', padding: '18px 52px 18px 24px', background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: 'white', outline: 'none', fontStyle: 'body', fontSize: '0.9rem' }}
                />
                <button 
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  style={{
                    position: 'absolute', right: '10px',
                    background: 'var(--color-primary)', border: 'none', color: 'white',
                    width: '42px', height: '42px', borderRadius: '14px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    opacity: !input.trim() || loading ? 0.5 : 1,
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
