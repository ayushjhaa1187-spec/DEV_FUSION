'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  GraduationCap 
} from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import AISolverPanel from '@/components/doubts/AISolverPanel';
import { toast } from 'sonner';

interface NewDoubtClientProps {
  subjects: any[];
}

export default function NewDoubtClient({ subjects }: NewDoubtClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<any>(null);
  const [contentText, setContentText] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [semester, setSemester] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiAttempted, setAiAttempted] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !contentText.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content, // The JSON from Tiptap
          content_text: contentText,
          subject_id: subjectId || null,
          semester: parseInt(semester),
          ai_attempted: aiAttempted,
        }),
      });

      if (!res.ok) throw new Error('Failed to post doubt');

      toast.success('Doubt posted successfully!');
      router.push('/doubts');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiFinished = (helped: boolean) => {
    setAiAttempted(true);
    setIsAiOpen(false);
    if (helped) {
      toast.info('Glad the AI could help! You can still post it if you need human insights.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <div className="p-2 rounded-full border border-white/5 bg-white/5 group-hover:border-white/10">
              <ArrowLeft size={18} />
            </div>
            <span className="text-sm font-bold uppercase tracking-tighter">Back to Feed</span>
          </button>

          <div className="flex gap-3">
             <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAiOpen(true)}
              disabled={!title || !contentText}
              className="px-6 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <Sparkles size={16} />
              Ask AI First
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting || !title || !contentText}
              className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? 'Posting...' : 'Post to Community'}
              <Send size={16} />
            </motion.button>
          </div>
        </div>

        {/* Title input */}
        <div className="mb-10">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Focus your doubt here (e.g., 'How does the CAP theorem handle latency?')"
            className="w-full bg-transparent border-none text-4xl lg:text-5xl font-black text-white placeholder:text-gray-800 focus:outline-none focus:ring-0 mb-4"
          />
          <div className="h-px w-full bg-gradient-to-r from-indigo-500/50 via-gray-800 to-transparent" />
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <BookOpen size={12} className="text-indigo-400" />
              Academic Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/5 text-gray-300 focus:border-indigo-500/30 focus:outline-none transition appearance-none"
            >
              <option value="">General / Other</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Layers size={12} className="text-indigo-400" />
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/5 text-gray-300 focus:border-indigo-500/30 focus:outline-none transition appearance-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s.toString()}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <GraduationCap size={12} className="text-indigo-400" />
              Branch Visibility
            </label>
            <div className="h-12 flex items-center px-5 rounded-2xl bg-white/5 border border-white/5 text-gray-500 text-xs font-bold italic">
              Auto-detected from Profile
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            Explain your hurdle in detail
          </label>
          <RichTextEditor
            content={content}
            onChange={(json, text) => {
              setContent(json);
              setContentText(text);
            }}
            placeholder="What exactly are you struggling with? Add code snippets or images if needed."
          />
        </div>

        {/* Tips Section */}
        <div className="mt-12 p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            Fast Resolution Tips
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Add clear constraints to your problem.',
              'Paste relevant code snippets for context.',
              'Mention what you\'ve already tried.',
              'Use AI solver first for instant clarity.'
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-500 text-xs font-medium">
                <div className="mt-1 w-1 h-1 rounded-full bg-indigo-500/50" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AISolverPanel
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        doubtTitle={title}
        doubtContent={content}
        onFinished={handleAiFinished}
      />
    </div>
  );
}
