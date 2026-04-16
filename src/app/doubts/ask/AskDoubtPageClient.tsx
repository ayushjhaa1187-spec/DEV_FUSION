'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doubtApi, aiApi, subjectApi } from '@/lib/api';
import RichTextEditor from '@/components/ui/RichTextEditor';
import LimitReachedModal from '@/components/modals/LimitReachedModal';
import './doubts-ask.css';

export default function AskDoubtPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: searchParams.get('title') || '',
    content: searchParams.get('content') || null,
    subject_id: searchParams.get('subject_id') || '',
    branch: '',
    semester: '',
  });

  const [step, setStep] = useState(1); // 1: Input, 2: AI Review, 3: Success
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; total: number } | null>(null);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  useEffect(() => {
    subjectApi.getSubjects().then(setSubjects).catch(console.error);
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const data = await aiApi.getUsage();
      setUsage(data.usage);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  // Sync content if it comes as a string from searchParams
  useEffect(() => {
    const content = searchParams.get('content');
    if (content && !formData.content) {
      // If it's plain text, we might want to wrap it in a basic TipTap JSON structure or just leave it for the editor to handle
      setFormData(prev => ({ ...prev, content }));
    }
  }, [searchParams]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.subject_id) {
      setError('Please fill title, content and subject.');
      return;
    }

    if (usage && usage.used >= usage.total) {
      setIsLimitModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const textContent = typeof formData.content === 'string' ? formData.content : JSON.stringify(formData.content);
      const analysis = await aiApi.solveDoubt({ 
        question: `${formData.title}\n\n${textContent}` 
      });
      setAiAnalysis(analysis);
      setStep(2);
      fetchUsage(); // Refresh usage after successful solve
    } catch (err: any) {
      setError('AI analysis failed. You can skip to community post.');
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostToCommunity = async () => {
    setIsLoading(true);
    try {
      // Find subject name for the requirement if subject_id is internal
      const selectedSubject = subjects.find(s => s.id === formData.subject_id);
      
      const payload = {
        title: formData.title,
        body: typeof formData.content === 'string' ? formData.content : JSON.stringify(formData.content),
        subject: selectedSubject?.name || formData.subject_id || 'General'
      };

      await doubtApi.createDoubt(payload);
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
      <div className="sb-page ask-container success-view transition-all text-white flex items-center justify-center min-h-[60vh]">
        <div className="success-card glass p-12 rounded-[40px] border border-white/5 text-center bg-[#13132b]">
          <div className="success-icon w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-8">✓</div>
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Doubt Published!</h2>
          <p className="text-gray-500 font-medium">Redirecting you to the feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sb-page ask-container text-white">
      <div className="ask-header sb-stagger-1 mb-12">
        <h1 className="sb-title">Ask the <span>Community</span></h1>
        <p className="sb-subtitle max-w-2xl mx-auto">SkillBridge encourages learning intuition over just answers. Ask AI first to clarify your concepts.</p>
      </div>

      <div className="ask-progress sb-stagger-2 flex items-center justify-center gap-4 mb-12">
        <div className={`progress-step text-[10px] font-black uppercase tracking-widest ${step >= 1 ? 'text-indigo-400' : 'text-gray-600'}`}>1. Draft Doubt</div>
        <div className="progress-line w-8 h-px bg-white/10" />
        <div className={`progress-step text-[10px] font-black uppercase tracking-widest ${step >= 2 ? 'text-indigo-400' : 'text-gray-600'}`}>2. AI Conceptual Review</div>
        <div className="progress-line w-8 h-px bg-white/10" />
        <div className={`progress-step text-[10px] font-black uppercase tracking-widest ${step >= 3 ? 'text-indigo-400' : 'text-gray-600'}`}>3. Publish</div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleAnalyze} className="ask-form glass sb-stagger-2 max-w-3xl mx-auto bg-[#13132b] p-10 rounded-[40px] border border-white/5">
          <div className="form-group mb-8">
            <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Headline</label>
            <input 
              type="text" 
              placeholder="e.g., Why do we use 'virtual' keyword in C++?" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
              className="w-full bg-white/5 border border-white/5 p-4 rounded-xl outline-none focus:border-indigo-500/20 transition-all font-bold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="form-group">
              <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Subject</label>
              <select 
                value={formData.subject_id}
                onChange={e => setFormData({...formData, subject_id: e.target.value})}
                required
                className="w-full bg-white/5 border border-white/5 p-4 rounded-xl outline-none focus:border-indigo-500/20 transition-all font-bold appearance-none"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Academic Year (Opt.)</label>
              <input 
                type="text" 
                placeholder="e.g. 2nd Year / Sem 4" 
                value={formData.semester}
                onChange={e => setFormData({...formData, semester: e.target.value})}
                className="w-full bg-white/5 border border-white/5 p-4 rounded-xl outline-none focus:border-indigo-500/20 transition-all font-bold"
              />
            </div>
          </div>

          <div className="form-group mb-8">
            <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Detailed Content</label>
            <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden min-h-[200px]">
              <RichTextEditor 
                content={formData.content} 
                onChange={(json) => setFormData({...formData, content: json})}
                placeholder="Provide context, code snippets, or what you've tried..."
              />
            </div>
            <p className="help-text text-[10px] font-bold text-gray-600 mt-4 tracking-tight">
              Pro tip: Use the toolbar to add code snippets or images for faster peer resolution.
            </p>
          </div>

          {error && <p className="error-text text-red-500 text-xs font-bold mb-6">{error}</p>}

          <button type="submit" className="sb-btnPrimary w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Ready to Ask AI First —>'}
          </button>
        </form>
      ) : (
        <div className="ai-review-view glass max-w-4xl mx-auto bg-[#13132b] p-10 rounded-[40px] border border-white/5">
          <div className="ai-review-header flex justify-between items-center mb-10 pb-6 border-b border-white/5">
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">✨ Pedagogical Analysis</span>
            <div className="ai-review-actions">
              <button 
                onClick={handlePostToCommunity} 
                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition" 
                disabled={isLoading}
              >
                Still Unsatisfied? Post to Community
              </button>
            </div>
          </div>

          {aiAnalysis ? (
            <div className="ai-analysis-content space-y-10">
              <section className="analysis-intuition p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">The Intuition</h3>
                <p className="text-gray-300 leading-relaxed font-medium">{aiAnalysis.explanation}</p>
              </section>

              <section className="analysis-steps">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 px-4">Logical Breakdown</h3>
                <div className="step-list space-y-4">
                  {aiAnalysis.steps?.map((step: string, i: number) => (
                    <div key={i} className="step-item flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="step-num w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black flex-shrink-0">{i + 1}</span>
                      <p className="text-sm text-gray-400 font-medium pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="ai-footer-msg text-center py-8 border-t border-white/5">
                <p className="text-gray-500 text-xs font-medium">Did this clarify your doubt? If yes, great! If not, our community of high-reputation peers is ready to help.</p>
              </div>
            </div>
          ) : (
            <div className="ai-error-state py-20 text-center">
              <p className="text-gray-500 font-medium">We couldn't generate a conceptual preview at this moment. You can proceed to post your doubt to the community.</p>
            </div>
          )}
        </div>
      )}

      <LimitReachedModal 
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        used={usage?.used}
        total={usage?.total}
      />
    </div>
  );
}
