'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, ArrowRight, CheckCircle2 } from 'lucide-react';
import { doubtApi, aiApi, subjectApi } from '@/lib/api';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function AskDoubtModal({
  isOpen,
  onClose,
  onPublished,
  prefillContent,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPublished?: () => void;
  prefillContent?: string;
}) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: null as any,
    subject_id: '',
    semester: '',
  });
  const [step, setStep] = useState(1);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      subjectApi.getSubjects().then(setSubjects).catch(console.error);
      setStep(1);
      setError(null);
      setAiAnalysis(null);
      // Pre-fill title from AI question escalation
      if (prefillContent) {
        setFormData(prev => ({ ...prev, title: prefillContent }));
      } else {
        setFormData({ title: '', content: null, subject_id: '', semester: '' });
      }
    }
  }, [isOpen, prefillContent]);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.subject_id) {
      setError('Please fill in the title, content, and select a subject.');
      return;
    }
    setStep(2);
    setIsAiStreaming(true);
    setError(null);
    try {
      const textToAnalyze = `${formData.title}\n\n${typeof formData.content === 'string' ? formData.content : JSON.stringify(formData.content)}`;
      const analysis = await aiApi.solveDoubt({ question: textToAnalyze });
      setAiAnalysis(analysis);
    } catch (err: any) {
      setError('AI guidance interrupted. You can still post to the community.');
    } finally {
      setIsAiStreaming(false);
    }
  };

  const handlePost = async () => {
    setIsLoading(true);
    try {
      await doubtApi.createDoubt(formData);
      setStep(3);
      if (onPublished) onPublished();
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)', zIndex: 999,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'var(--color-surface)',
              borderRadius: '32px 32px 0 0',
              padding: '40px',
              zIndex: 1000,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                  {step === 1 ? 'Ask the Community' : step === 2 ? 'AI Insights' : 'Success'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: 4 }}>
                  {step === 1 ? 'Craft your doubt for the community and AI.' :
                   step === 2 ? 'Pedagogical breakdown generated.' : 'Resolved.'}
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <X size={18} />
              </button>
            </div>

            {/* Step 1: Input Form */}
            {step === 1 && (
              <form onSubmit={handleAskAI} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>HEADLINE</label>
                  <input
                    type="text"
                    placeholder="Contextual heading of your doubt..."
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px', color: 'white', fontSize: '1.1rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>SUBJECT</label>
                  <select
                    value={formData.subject_id}
                    onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px', color: 'white', outline: 'none' }}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>SEMESTER (OPTIONAL)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sem 4"
                    value={formData.semester}
                    onChange={e => setFormData({ ...formData, semester: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px', color: 'white', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>DETAILED CONTENT</label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(json) => setFormData({ ...formData, content: json })}
                    placeholder="Use code snippets or images for faster peer resolution..."
                  />
                </div>
                {error && <p style={{ color: '#ef4444' }}>{error}</p>}
                <button type="submit" disabled={isLoading} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '16px', padding: '16px 24px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} />
                  {isLoading ? 'Processing...' : 'Ask AI First'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Step 2: AI Review */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 20, padding: 24 }}>
                  <h3 style={{ fontWeight: 700, color: 'white', marginBottom: 12 }}>Conceptual Intuition</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                    {aiAnalysis?.explanation || 'AI analysis unavailable. Proceed to post.'}
                  </p>
                  {aiAnalysis?.steps && (
                    <>
                      <h3 style={{ fontWeight: 700, color: 'white', marginTop: 16, marginBottom: 12 }}>Stepped Resolution</h3>
                      <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {aiAnalysis.steps.map((s: string, i: number) => (
                          <li key={i} style={{ color: 'rgba(255,255,255,0.7)' }}>
                            <span style={{ color: 'var(--color-primary)', fontWeight: 700, marginRight: 8 }}>{i + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={onClose} style={{ flex: 1, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '16px', cursor: 'pointer', fontWeight: 600 }}>
                    This helped
                  </button>
                  <button onClick={handlePost} disabled={isLoading} style={{ flex: 2, background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '16px', padding: '16px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Send size={16} />
                    {isLoading ? 'Publishing...' : 'Still confused — post to community'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ color: 'white', fontWeight: 700, marginBottom: 8 }}>Doubt Published!</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>The SkillBridge community has been notified. Redirecting to feed...</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
