'use client';

import React, { useState } from 'react';
import { cn } from './Button';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'underline' | 'pills';
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(({
  tabs,
  defaultTab,
  onChange,
  variant = 'underline',
  className,
  ...props
}, ref) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return;
    setActiveTab(tabId);
    if (onChange) onChange(tabId);
  };

  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  return (
    <div ref={ref} className={cn('w-full', className)} {...props}>
      <div className={cn(
        'flex overflow-x-auto no-scrollbar',
        variant === 'underline' ? 'border-b border-border-color space-x-6' : 'space-x-2 bg-bg-secondary p-1 rounded-2xl w-max'
      )}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.disabled)}
              disabled={tab.disabled}
              className={cn(
                'relative flex items-center gap-2 whitespace-nowrap transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
                variant === 'underline' 
                  ? 'pb-4 pt-2 text-sm font-medium border-b-2 border-transparent' 
                  : 'px-4 py-2 text-sm font-semibold rounded-xl z-10',
                isActive
                  ? (variant === 'underline' ? 'text-primary' : 'text-text-primary')
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              
              {isActive && variant === 'underline' && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              {isActive && variant === 'pills' && (
                <motion.div
                  layoutId="pill"
                  className="absolute inset-0 bg-bg-primary shadow-sm rounded-xl -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-6">
        {activeContent}
      </div>
    </div>
  );
});

Tabs.displayName = 'Tabs';
