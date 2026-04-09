'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, ArrowRight, CheckCircle2 } from 'lucide-react';
import { doubtApi, aiApi, subjectApi } from '@/lib/api';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function AskDoubtModal({ isOpen, onClose, onPublished }: { isOpen: boolean, onClose: () => void, onPublished?: () => void }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: null as any,
    subject_id: '',
    semester: '',
  });
  const [step, setStep] = useState(1); // 1: Input, 2: AI Review, 3: Success
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      subjectApi.getSubjects().then(setSubjects).catch(console.error);
      setStep(1);
      setError(null);
    }
  }, [isOpen]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.subject_id) {
      setError('Please fill in the title, content, and select a subject.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const textToAnalyze = `${formData.title}\n\n${typeof formData.content === 'string' ? formData.content : JSON.stringify(formData.content)}`;
      const analysis = await aiApi.solveDoubt({ question: textToAnalyze });
      setAiAnalysis(analysis);
      setStep(2);
    } catch (err: any) {
      if (err.message?.includes('Free tier limit reached')) {
        setError(err.message);
        // We stay on step 1 so they can see the error
      } else {
        setError('AI analysis fragmented. Proceed to community post?');
        setStep(2);
      }
    } finally {
      setIsLoading(false);
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
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)', zIndex: 999998
            }}
          />

          {/* Slide-up Modal */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: '10%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '900px', maxWidth: '95vw', height: '90vh',
              background: 'var(--color-surface)', borderTopLeftRadius: '40px', borderTopRightRadius: '40px',
              border: '1px solid var(--color-border)', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
              zIndex: 999999, overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{ padding: '32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>
                  {step === 1 ? 'Draft choice' : step === 2 ? 'AI Insights' : 'Success'}
                </h2>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>
                  {step === 1 ? 'Craft your doubt for the community and AI.' : step === 2 ? 'Pedagogical breakdown generated.' : 'Resolved.'}
                </p>
              </div>
              <button 
                onClick={onClose}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '12px', borderRadius: '16px', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>HEADLINE</label>
                    <input 
                      type="text" 
                      placeholder="Contextual heading of your doubt..."
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px', color: 'white', fontSize: '1.1rem', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>SUBJECT</label>
                      <select 
                        value={formData.subject_id}
                        onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px', color: 'white', outline: 'none' }}
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>SEMESTER (OPTIONAL)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sem 4"
                        value={formData.semester}
                        onChange={e => setFormData({ ...formData, semester: e.target.value })}
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px', color: 'white', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>DETAILED CONTENT</label>
                    <RichTextEditor 
                      content={formData.content}
                      onChange={(json) => setFormData({ ...formData, content: json })}
                      placeholder="Use code snippets or images for faster peer resolution..."
                    />
                  </div>

                  {error && <p style={{ color: '#ef4444', margin: 0, fontWeight: 600 }}>{error}</p>}
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div style={{ background: 'rgba(124, 58, 237, 0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Sparkles size={18} color="#a78bfa" />
                      <h3 style={{ margin: 0, color: '#a78bfa', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conceptual Intuition</h3>
                    </div>
                    <p style={{ margin: 0, lineHeight: 1.6, color: '#ccd6f6' }}>{aiAnalysis?.explanation || 'AI analysis unavailable. Proceed to post.'}</p>
                  </div>

                  {aiAnalysis?.steps && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Stepped Resolution</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {aiAnalysis.steps.map((step: string, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <span style={{ minWidth: '28px', height: '28px', background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{i + 1}</span>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(6, 214, 160, 0.1)', color: '#06d6a0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Doubt Published!</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>The SkillBridge community has been notified. Redirecting to feed...</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '32px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {step === 1 && (
                <button 
                  onClick={handleAnalyze} 
                  disabled={isLoading}
                  style={{ 
                    padding: '16px 32px', borderRadius: '16px', background: 'var(--color-primary)', 
                    color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '12px'
                  }}
                >
                  {isLoading ? 'Processing...' : 'Ready to Ask AI First'} 
                  <ArrowRight size={20} />
                </button>
              )}
              {step === 2 && (
                <>
                  <button 
                    onClick={() => setStep(1)}
                    style={{ padding: '16px 32px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid var(--color-border)', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Edit Draft
                  </button>
                  <button 
                    onClick={handlePost}
                    disabled={isLoading}
                    style={{ padding: '16px 32px', borderRadius: '16px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {isLoading ? 'Publishing...' : 'Post to Community'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
