'use client';

import { useState } from 'react';
import { Code2, Sparkles, Copy, Check, Terminal, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CodeExplainerPage() {
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExplain = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: `Explain this code piece by piece and suggest optimizations: \n\n${code}`,
          context: 'CODE_EXPLANATION'
        }),
      });
      const data = await res.json();
      setExplanation(data);
    } catch (err) {
      console.error('Explanation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white">
      
      <div className="max-w-6xl mx-auto px-6 py-20">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Code2 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black">AI Code Explainer</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Paste any snippet of code and get a deep conceptual breakdown from SkillBridge AI.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Area */}
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste your complex code here..."
                className="w-full h-[500px] bg-[#161623] border border-gray-800 rounded-3xl p-8 font-mono text-sm leading-relaxed outline-none focus:border-indigo-500/50 transition-colors resize-none"
              />
            </div>
            <button
              onClick={handleExplain}
              disabled={loading || !code.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-indigo-500/10 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  ))}
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Explain Intuition
                </>
              )}
            </button>
          </div>

          {/* Output Area */}
          <div className="bg-[#1e1e2e] border border-gray-800 rounded-3xl p-8 overflow-y-auto max-h-[570px] custom-scrollbar">
            <AnimatePresence mode="wait">
              {explanation ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Deep Dive</h3>
                    <p className="text-gray-200 leading-relaxed text-lg font-medium">
                      {explanation.explanation}
                    </p>
                  </div>

                  {explanation.steps && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        Execution Flow
                      </h3>
                      {explanation.steps.map((step: string, i: number) => (
                        <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-gray-800">
                          <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black">
                            {i + 1}
                          </span>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-8 border-t border-gray-800">
                    <p className="text-sm text-gray-500 mb-6 font-medium italic">
                      Still feeling stuck? You can post this code snippets to the community to get help from your peers and mentors.
                    </p>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set('title', 'Explain this code: ' + (code.split('\n')[0].slice(0, 50) || 'Doubt'));
                        params.set('content', code);
                        window.location.href = `/doubts/ask?${params.toString()}`;
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:border-indigo-500/50 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Post to Community Hub <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Awaiting Code</h3>
                  <p className="text-sm max-w-xs">
                    Synthesizing code into semantic explanations takes a few seconds. Paste code on the left to begin.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
