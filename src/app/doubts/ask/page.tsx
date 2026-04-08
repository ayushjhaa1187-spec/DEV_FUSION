'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doubtApi, aiApi, subjectApi } from '@/lib/api';
import './doubts-ask.css';

export default function AskDoubtPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject_id: '',
    branch: '',
    semester: '',
  });

  const [step, setStep] = useState(1); // 1: Input, 2: AI Review, 3: Success
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    subjectApi.getSubjects().then(setSubjects).catch(console.error);
  }, []);

  const [previewMode, setPreviewMode] = useState(false);

  const handleAnalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.subject_id) {
      setError('Please fill title, content and subject.');
      return;
    }
    setIsLoading(true);
    setPreviewMode(false);
    setError(null);
    try {
      // Use the solving endpoint but for pre-post analysis
      const analysis = await aiApi.solveDoubt({ 
        question: `${formData.title}\n\n${formData.content}` 
      });
      setAiAnalysis(analysis);
      setStep(2);
    } catch (err: any) {
      setError('AI analysis failed. You can skip to community post.');
      setStep(2); // Allow skip on error
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostToCommunity = async () => {
    setIsLoading(true);
    try {
      await doubtApi.createDoubt(formData);
      setStep(3);
      setTimeout(() => router.push('/doubts'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="sb-page ask-container success-view transition-all">
        <div className="success-card glass sb-stagger-1">
          <div className="success-icon">✓</div>
          <h2>Doubt Published!</h2>
          <p>Redirecting you to the feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sb-page ask-container">
      <div className="ask-header sb-stagger-1">
        <h1 className="sb-title">Ask the <span>Community</span></h1>
        <p className="sb-subtitle">SkillBridge encourages learning intuition over just answers. Ask AI first to clarify your concepts.</p>
      </div>

      <div className="ask-progress sb-stagger-2">
        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Draft Doubt</div>
        <div className="progress-line" />
        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. AI Conceptual Review</div>
        <div className="progress-line" />
        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Publish</div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleAnalize} className="ask-form glass sb-stagger-2">
          <div className="form-group">
            <label>Headline</label>
            <input 
              type="text" 
              placeholder="e.g., Why do we use 'virtual' keyword in C++?" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Subject</label>
              <select 
                value={formData.subject_id}
                onChange={e => setFormData({...formData, subject_id: e.target.value})}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Academic Year (Opt.)</label>
              <input 
                type="text" 
                placeholder="e.g. 2nd Year / Sem 4" 
                value={formData.semester}
                onChange={e => setFormData({...formData, semester: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Detailed Content</label>
              <div className="editor-toolbar" style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => {
                  const ta = document.querySelector('textarea');
                  if (!ta) return;
                  const start = ta.selectionStart;
                  const end = ta.selectionEnd;
                  const text = ta.value;
                  const before = text.substring(0, start);
                  const selected = text.substring(start, end);
                  const after = text.substring(end);
                  setFormData({...formData, content: before + '**' + selected + '**' + after});
                }} className="sb-btnGhost" style={{ padding: '2px 8px', minWidth: '32px' }}><b>B</b></button>
                <button type="button" onClick={() => {
                  const ta = document.querySelector('textarea');
                  if (!ta) return;
                  const start = ta.selectionStart;
                  const end = ta.selectionEnd;
                  const text = ta.value;
                  const before = text.substring(0, start);
                  const selected = text.substring(start, end);
                  const after = text.substring(end);
                  setFormData({...formData, content: before + '`' + selected + '`' + after});
                }} className="sb-btnGhost" style={{ padding: '2px 8px', minWidth: '32px' }}><code>{'<>'}</code></button>
                <button 
                  type="button" 
                  onClick={() => setPreviewMode(!previewMode)}
                  className="sb-btnGhost" 
                  style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                >
                  {previewMode ? 'Edit Content' : 'Preview Rich Text'}
                </button>
              </div>
            </div>
            {previewMode ? (
              <div className="rich-preview glass" style={{ minHeight: '200px', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="preview-content" style={{ opacity: 0.9 }}>
                  {formData.content.split('\n').map((line, i) => (
                    <p key={i} style={{ marginBottom: line ? '0.5rem' : '1rem' }}>
                      {line.startsWith('```') ? <code style={{ display: 'block', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>{line.replace(/```/g, '')}</code> : line}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <textarea 
                placeholder="Provide context, code snippets, or what you've tried..." 
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                rows={8}
                required
              />
            )}
            <p className="help-text" style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>
              Pro tip: Use ``` to start/end code blocks. AI will help with auto-tagging.
            </p>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="sb-btnPrimary" disabled={isLoading} style={{ width: '100%', marginTop: '20px', border: 'none' }}>
            {isLoading ? 'Processing...' : 'Ready to Ask AI First —>'}
          </button>
        </form>
      ) : (
        <div className="ai-review-view glass">
          <div className="ai-review-header">
            <span className="sb-heroBadge" style={{ margin: 0 }}>✨ Pedagogical Analysis</span>
            <div className="ai-review-actions">
              <button 
                onClick={handlePostToCommunity} 
                className="sb-btnGhost" 
                disabled={isLoading}
              >
                Still Unsatisfied? Post to Community
              </button>
            </div>
          </div>

          {aiAnalysis ? (
            <div className="ai-analysis-content">
              <section className="analysis-intuition">
                <h3>The Intuition</h3>
                <p>{aiAnalysis.explanation}</p>
              </section>

              <section className="analysis-steps">
                <h3>Logical Breakdown</h3>
                <div className="step-list">
                  {aiAnalysis.steps?.map((step: string, i: number) => (
                    <div key={i} className="step-item">
                      <span className="step-num">{i + 1}</span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="ai-footer-msg">
                <p>Did this clarify your doubt? If yes, great! If not, our community of high-reputation peers is ready to help.</p>
              </div>
            </div>
          ) : (
            <div className="ai-error-state">
              <p>We couldn't generate a conceptual preview at this moment. You can proceed to post your doubt to the community.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
