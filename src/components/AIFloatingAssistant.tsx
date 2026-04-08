'use client';

import { useState } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

export default function AIFloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role:'user'|'ai', content:string}[]>([
    { role: 'ai', content: 'Hi! I\'m your DevFusion AI tutor. Ask me anything about your studies!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
        : data.error || 'Sorry, I got an unexpected response.';
        
      const aiMsg = { role: 'ai' as const, content: aiContent };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I\'m offline. Try again!' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = ["Explain this concept", "Help me debug", "Quiz me on this topic"];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .ai-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(108, 99, 255, 0.4);
          transition: transform 0.2s;
        }
        .ai-fab:hover {
          transform: scale(1.05);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ai-panel { 
          animation: slideUp 250ms cubic-bezier(0.16,1,0.3,1); 
          position: fixed;
          bottom: 100px;
          right: 24px;
          z-index: 9999;
          width: 400px;
          height: 500px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
          overflow: hidden;
        }
        .ai-panel-header {
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        }
        .ai-panel-close {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
        }
        .ai-panel-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ai-msg {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.9rem;
          line-height: 1.4;
          white-space: pre-wrap;
        }
        .ai-msg.user {
          align-self: flex-end;
          background: var(--color-primary);
          color: white;
          border-bottom-right-radius: 2px;
        }
        .ai-msg.ai {
          align-self: flex-start;
          background: rgba(255,255,255,0.05);
          color: var(--color-text);
          border-bottom-left-radius: 2px;
        }
        .ai-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0 16px 12px;
        }
        .ai-chip {
          background: rgba(108, 99, 255, 0.1);
          border: 1px solid rgba(108, 99, 255, 0.2);
          color: var(--color-primary);
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-chip:hover {
          background: rgba(108, 99, 255, 0.2);
        }
        .ai-input-area {
          padding: 12px 16px;
          border-top: 1px solid var(--color-border);
          display: flex;
          gap: 8px;
        }
        .ai-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 8px 16px;
          color: var(--color-text);
          outline: none;
        }
        .ai-send-btn {
          background: var(--color-primary);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .ai-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 480px) {
          .ai-panel {
            width: calc(100vw - 32px);
            right: 16px;
            bottom: 90px;
          }
        }
      `}} />
      
      {!isOpen && (
        <button className="ai-fab" onClick={() => setIsOpen(true)}>
          <Sparkles size={24} />
        </button>
      )}

      {isOpen && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--color-primary)" />
              DevFusion AI Assistant
            </div>
            <button className="ai-panel-close" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="ai-panel-body">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="ai-msg ai">
                Thinking...
              </div>
            )}
          </div>

          <div className="ai-chips">
            {quickPrompts.map(prompt => (
              <button 
                key={prompt} 
                className="ai-chip"
                onClick={() => sendMessage(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="ai-input-area">
            <input 
              type="text" 
              className="ai-input" 
              placeholder="Ask a question..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <button 
              className="ai-send-btn" 
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
