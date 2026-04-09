'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Mic, History, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    "How to manage recursion?", 
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
            whileTap={{ scale: 0.9 }}
            className="ai-fab" 
            onClick={() => setIsOpen(true)}
            style={{
              width: '64px', height: '64px', borderRadius: '24px', borderTopLeftRadius: '4px',
              background: 'linear-gradient(135deg, #7c3aed, #06d6a0)',
              color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(124, 58, 237, 0.4)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div className="ai-fab-glow" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent)', opacity: 0.6 }} />
            <Sparkles size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="ai-panel glass"
            style={{
              width: '440px', height: '680px', maxHeight: '85vh',
              background: 'rgba(9, 9, 15, 0.85)', backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '-20px 20px 60px rgba(0,0,0,0.6)',
              position: 'absolute', bottom: '0', right: '0'
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: 'rgba(124, 58, 237, 0.15)', borderRadius: '12px' }}>
                  <Sparkles size={20} color="#a78bfa" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>SkillBridge <span>AI</span></h3>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#06d6a0', fontWeight: 600 }}>● Online & Thinking</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setMessages([{ role: 'ai', content: 'System cleared. Ready for new queries.' }])}>
                  <RotateCcw size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  style={{ 
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '16px 20px',
                    borderRadius: '20px',
                    fontSize: '0.92rem',
                    lineHeight: 1.5,
                    border: '1px solid rgba(255,255,255,0.03)',
                    background: m.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.05)',
                    color: m.role === 'user' ? 'white' : '#e2e8f0',
                    borderBottomRightRadius: m.role === 'user' ? '4px' : '20px',
                    borderBottomLeftRadius: m.role === 'ai' ? '4px' : '20px',
                  }}
                >
                  {m.content}
                </motion.div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: '20px', display: 'flex', gap: '4px' }}>
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }}>•</motion.span>
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>•</motion.span>
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>•</motion.span>
                </div>
              )}
            </div>

            {/* Suggested Chips */}
            <div style={{ padding: '0 24px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {quickPrompts.map(p => (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={p} 
                  onClick={() => sendMessage(p)}
                  style={{
                    padding: '8px 16px', borderRadius: '99px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.78rem',
                    cursor: 'pointer', fontWeight: 600
                  }}
                >
                  {p}
                </motion.button>
              ))}
            </div>

            {/* Input Area */}
            <div style={{ padding: '20px 24px 28px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask SkillBridge AI..."
                  style={{
                    width: '100%', padding: '16px 52px 16px 20px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px', color: 'white', outline: 'none', transition: 'border-color 0.2s'
                  }}
                />
                <div style={{ position: 'absolute', right: '12px', display: 'flex', gap: '8px' }}>
                  <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Mic size={20} /></button>
                  <button 
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    style={{
                      background: 'var(--color-primary)', border: 'none', color: 'white',
                      width: '36px', height: '36px', borderRadius: '12px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      opacity: !input.trim() || loading ? 0.5 : 1
                    }}
                  >
                    <Send size={18} style={{ margin: 'auto' }} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
