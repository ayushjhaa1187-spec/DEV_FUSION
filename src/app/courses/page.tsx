'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Play, Clock, BookOpen, Star, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const courses = [
  {
    id: 'dsa-mastery',
    title: 'Data Structures & Algorithms Mastery',
    instructor: 'Abdul Bari',
    duration: '45 Hours',
    rating: 4.9,
    students: 12400,
    tags: ['Computer Science', 'Placement'],
    image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=2128&auto=format&fit=crop'
  },
  {
    id: 'system-design',
    title: 'Advanced System Design for Scale',
    instructor: 'Gaurav Sen',
    duration: '22 Hours',
    rating: 4.8,
    students: 8900,
    tags: ['Architecture', 'Scaling'],
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
  },
  {
    id: 'os-internals',
    title: 'Operating Systems: Internal Perspective',
    instructor: 'Gate Smashers',
    duration: '18 Hours',
    rating: 4.7,
    students: 15000,
    tags: ['Core CS', 'University'],
    image: 'https://images.unsplash.com/photo-1518433278981-1127cc584102?q=80&w=2128&auto=format&fit=crop'
  }
];

export default function CoursesHub() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-32">
        <header className="mb-20">
           <div className="flex items-center gap-2 text-indigo-500 mb-4">
              <Play className="w-5 h-5 fill-indigo-500" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Curated Learning</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-black font-heading tracking-tighter mb-8">
             Educational <span>Vault</span>
           </h1>
           <p className="text-gray-500 max-w-2xl text-lg">
             Master core engineering concepts with curated multi-module video courses delivered by specialized academics.
           </p>
        </header>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-6 mb-16 items-center">
           <div className="flex-1 relative w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" />
              <input 
                type="text"
                placeholder="Search lectures, masters, or subjects..."
                className="w-full bg-[#13132b] border border-white/5 py-6 pl-16 pr-8 rounded-[24px] outline-none focus:border-indigo-500/30 transition-all font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex gap-4 p-2 bg-white/5 rounded-2xl border border-white/5">
              {['All', 'Core CS', 'Development', 'Placement'].map(cat => (
                <button key={cat} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${cat === 'All' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                  {cat}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {courses.map((course, i) => (
             <motion.div
               key={course.id}
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="group cursor-pointer"
             >
               <div className="bg-[#13132b] border border-white/5 rounded-[40px] overflow-hidden group-hover:border-indigo-500/20 transition-all">
                  <div className="aspect-video relative overflow-hidden">
                     <img src={course.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black">
                           <Play size={24} className="ml-1" />
                        </div>
                     </div>
                  </div>
                  <div className="p-8">
                     <div className="flex flex-wrap gap-2 mb-4">
                        {course.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg">{tag}</span>
                        ))}
                     </div>
                     <h3 className="text-2xl font-black mb-2 leading-tight">{course.title}</h3>
                     <p className="text-gray-500 text-sm mb-8 font-medium">By {course.instructor}</p>
                     
                     <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-4 text-gray-500 text-xs font-bold">
                           <span className="flex items-center gap-1"><Clock size={14} /> {course.duration}</span>
                           <span className="flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor" /> {course.rating}</span>
                        </div>
                        <Link href={`/courses/${course.id}`} className="p-4 bg-white/5 rounded-2xl group-hover:bg-indigo-600 transition-colors">
                           <ArrowRight size={20} />
                        </Link>
                     </div>
               </div>
               </div>
             </motion.div>
           ))}
        </div>

        {/* Coming Soon Teaser */}
        <div className="mt-32 p-16 bg-gradient-to-br from-indigo-900/20 to-transparent border border-white/5 rounded-[60px] text-center">
           <BookOpen size={48} className="mx-auto mb-8 text-indigo-500" />
           <h2 className="text-4xl font-black mb-6">Want to teach?</h2>
           <p className="text-gray-500 max-w-xl mx-auto text-lg mb-12 italic">"The best way to learn is to teach." Join our mentor network and build your academic influence.</p>
           <button className="sb-btnSecondary" style={{ pointerEvents: 'none', opacity: 0.5 }}>Educator Dashboard Coming Soon</button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
