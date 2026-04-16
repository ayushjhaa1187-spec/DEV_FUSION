'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { GraduationCap, UserCheck, Building2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface GatewayProps {
  onSelect: (role: 'student' | 'mentor' | 'organization') => void;
}

export default function Gateway({ onSelect }: GatewayProps) {
  const options = [
    {
      id: 'student',
      title: 'Student',
      description: 'Solve doubts, take tests, and earn verified certificates.',
      icon: GraduationCap,
      color: 'indigo',
      gradient: 'from-indigo-500 to-blue-600',
      shadow: 'shadow-indigo-500/20',
    },
    {
      id: 'mentor',
      title: 'Mentor',
      description: 'Share your expertise, guide students, and build your reputation.',
      icon: UserCheck,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/20',
    },
    {
      id: 'organization',
      title: 'Organization',
      description: 'Recruit top talent, manage teams, and verify credentials.',
      icon: Building2,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
    },
  ];

  return (
    <div className="w-full max-w-4xl space-y-8 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          Choose Your <span className="text-indigo-500">Path</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Welcome to the SkillBridge Ecosystem. Select your role to continue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option, idx) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <button
              onClick={() => onSelect(option.id as any)}
              className="group relative w-full text-left transition-all duration-300 hover:-translate-y-2 focus:outline-none"
            >
              <div className={`absolute -inset-1 bg-gradient-to-r ${option.gradient} rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200`}></div>
              <Card className="relative h-full bg-[#0d091a] border-white/5 overflow-hidden p-8 flex flex-col justify-between">
                <div>
                   <div className={`p-4 rounded-xl bg-white/5 w-fit mb-6 group-hover:scale-110 transition-transform`}>
                      <option.icon className={`w-8 h-8 text-white`} />
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-2">{option.title}</h3>
                   <p className="text-gray-400 text-sm leading-relaxed mb-8">
                     {option.description}
                   </p>
                </div>
                
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  Get Started
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                
                {/* Background Ornament */}
                <div className={`absolute -right-4 -bottom-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity`}>
                   <option.icon className="w-32 h-32 text-white" />
                </div>
              </Card>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
