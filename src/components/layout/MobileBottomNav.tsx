'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Zap, 
  User, 
  Video, 
  Search, 
  LineChart,
  ShieldCheck,
  Building2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setRole(profile?.role || 'student');
      }
    }
    getRole();
  }, [supabase]);

  if (!role || pathname === '/' || pathname?.startsWith('/auth')) return null;

  const navConfigs: Record<string, any[]> = {
    student: [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard, href: '/dashboard' },
      { id: 'doubts', label: 'Doubts', icon: MessageSquare, href: '/doubts' },
      { id: 'tests', label: 'Tests', icon: Zap, href: '/tests' },
      { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
    ],
    mentor: [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard, href: '/mentor/dashboard' },
      { id: 'sessions', label: 'Sessions', icon: Video, href: '/mentor/sessions' },
      { id: 'doubts', label: 'Doubt Feed', icon: Search, href: '/doubts/feed' },
      { id: 'profile', label: 'Profile', icon: '/profile' },
    ],
    organization: [
      { id: 'dashboard', label: 'Hub', icon: Building2, href: '/organization/dashboard' },
      { id: 'recruitment', label: 'Talent', icon: ShieldCheck, href: '/organization/dashboard?tab=recruitment' },
      { id: 'analytics', label: 'Radar', icon: LineChart, href: '/organization/dashboard?tab=analytics' },
      { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
    ],
  };

  const navItems = navConfigs[role] || navConfigs.student;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-around p-2 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
        
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.id === 'dashboard' && pathname?.includes('dashboard'));
          
          return (
            <Link 
              key={item.id} 
              href={item.href}
              className="relative flex flex-col items-center justify-center py-2 px-3 transition-colors duration-300 group"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-emerald-500/10 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <item.icon 
                size={22} 
                className={`relative z-10 transition-all duration-300 ${
                  isActive ? 'text-emerald-400 scale-110' : 'text-gray-500 group-hover:text-gray-300'
                }`} 
              />
              <span className={`text-[10px] mt-1 relative z-10 font-bold uppercase tracking-wider transition-all duration-300 ${
                isActive ? 'text-emerald-400 opacity-100' : 'text-gray-600 opacity-0 scale-75'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
