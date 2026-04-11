'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Check, Search, X, BookOpen, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface SubjectSelectorProps {
  selectedSubjectIds: string[];
  onSubjectsChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function SubjectSelector({ selectedSubjectIds, onSubjectsChange, disabled }: SubjectSelectorProps) {
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function loadSubjects() {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setAllSubjects(data);
      }
      setIsLoading(false);
    }
    loadSubjects();
  }, [supabase]);

  const filteredSubjects = allSubjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSubject = (id: string) => {
    if (disabled) return;
    if (selectedSubjectIds.includes(id)) {
      onSubjectsChange(selectedSubjectIds.filter(sid => sid !== id));
    } else {
      onSubjectsChange([...selectedSubjectIds, id]);
    }
  };

  const selectedSubjects = allSubjects.filter(s => selectedSubjectIds.includes(s.id));

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Search subjects (e.g. Data Structures)..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:bg-white/5 dark:border-white/10 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled || isLoading}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {selectedSubjects.map((s) => (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              key={s.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20"
            >
              {s.name}
              <button 
                onClick={() => toggleSubject(s.id)}
                className="hover:text-indigo-900 dark:hover:text-white"
                disabled={disabled}
              >
                <X size={12} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 p-1 space-y-1">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-gray-500">Loading subjects...</div>
        ) : filteredSubjects.length > 0 ? (
          filteredSubjects.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSubject(s.id)}
              disabled={disabled}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                selectedSubjectIds.includes(s.id) 
                  ? 'bg-indigo-600 text-white font-bold' 
                  : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex flex-col">
                <span>{s.name}</span>
                <span className={`text-[10px] opacity-70 ${selectedSubjectIds.includes(s.id) ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {s.code || 'NO CODE'}
                </span>
              </div>
              {selectedSubjectIds.includes(s.id) && <Check size={14} />}
            </button>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-gray-500">No subjects found</div>
        )}
      </div>
    </div>
  );
}
