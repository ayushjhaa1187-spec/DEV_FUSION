'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Star, Users, CheckCircle, ArrowLeft, Lock } from 'lucide-react';

interface CourseDetailClientProps {
  course: any;
}

export default function CourseDetailClient({ course }: CourseDetailClientProps) {
  const [activeModule, setActiveModule] = useState(0);
  const [tab, setTab] = useState<'overview' | 'modules'>('overview');

  if (!course) return (
    <main className="min-h-screen bg-[#0d0d1a] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h2 className="text-3xl font-black mb-4">Course Not Found</h2>
        <Link href="/courses" className="text-indigo-400 font-bold">← Back to Courses</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">

      {/* Hero */}
      <div className="relative h-[50vh] overflow-hidden">
        <img src={course.image} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/80 to-transparent" />
        <div className="absolute bottom-12 left-0 right-0 max-w-6xl mx-auto px-6">
          <Link href="/courses" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold mb-6 transition-colors w-fit">
            <ArrowLeft size={16} /> Back to Courses
          </Link>
          <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tighter mb-4">{course.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-bold">
            <span className="flex items-center gap-2"><Star size={14} className="text-amber-400 fill-amber-400" /> {course.rating} rating</span>
            <span className="flex items-center gap-2"><Users size={14} /> {course.students.toLocaleString()} enrolled</span>
            <span className="flex items-center gap-2"><Clock size={14} /> {course.duration}</span>
            <span className="text-indigo-400">By {course.instructor}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Video Player & Modules */}
          <div className="lg:col-span-2">
            {/* Player */}
            <div className="aspect-video bg-black rounded-[32px] overflow-hidden mb-8 shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/videoseries?list=${course.playlist}&autoplay=1`}
                className="w-full h-full border-none"
                allowFullScreen
                allow="autoplay"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit mb-10">
              {(['overview', 'modules'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-8 py-3 rounded-xl text-sm font-black capitalize transition-all ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'overview' ? (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="text-2xl font-black mb-4">About This Course</h2>
                  <p className="text-gray-400 leading-relaxed mb-10">{course.description}</p>
                  <h3 className="text-xl font-black mb-6">What You Will Learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.outcomes.map((o: string, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-6 bg-[#13132b] rounded-[24px] border border-white/5">
                        <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">{o}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="modules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h2 className="text-2xl font-black mb-6">Course Modules</h2>
                  <div className="space-y-3">
                    {course.modules.map((mod: any, i: number) => (
                      <button
                        key={mod.id}
                        onClick={() => mod.free ? setActiveModule(i) : null}
                        className={`w-full flex items-center justify-between p-6 rounded-[24px] border transition-all text-left ${activeModule === i ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-[#13132b] border-white/5 hover:border-white/10'} ${!mod.free ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${activeModule === i ? 'bg-indigo-600' : 'bg-white/5'}`}>
                            {mod.free ? (activeModule === i ? '▶' : i + 1) : <Lock size={14} />}
                          </div>
                          <span className="font-bold">{mod.title}</span>
                          {mod.free && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-lg uppercase">Free</span>}
                        </div>
                        <span className="text-gray-600 text-sm">{mod.duration}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar CTA */}
          <div>
            <div className="bg-[#13132b] border border-white/5 rounded-[40px] p-8 sticky top-28">
              <div className="text-4xl font-black mb-2">Free</div>
              <p className="text-gray-500 text-sm mb-8 font-medium">2 free modules · Upgrade for full access</p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <CheckCircle size={16} className="text-emerald-500" /> Lifetime access
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <CheckCircle size={16} className="text-emerald-500" /> Certificate on completion
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <CheckCircle size={16} className="text-emerald-500" /> AI doubt assistant included
                </div>
              </div>

              <Link href="/pricing" className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all mb-4">
                Unlock Full Course
              </Link>
              <button className="w-full text-center text-gray-500 font-bold text-sm py-3 hover:text-white transition-colors">
                Preview Free Modules →
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
