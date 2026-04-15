'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
}

export default function EmptyState({ icon: Icon, title, description, actionText, actionHref }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center sb-glass py-20"
    >
      <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 shadow-inner">
        <Icon size={40} className="text-violet-500 opacity-80" />
      </div>
      <h3 className="text-xl font-black mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8 font-medium leading-relaxed">
        {description}
      </p>
      {actionText && actionHref && (
        <Link href={actionHref} className="sb-btn-primary scale-110">
          {actionText}
        </Link>
      )}
    </motion.div>
  );
}
