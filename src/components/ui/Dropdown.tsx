'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from './Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  items, 
  trigger, 
  align = 'left',
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return;
    if (item.onClick) item.onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-flex items-center">
        {trigger || (
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary rounded-xl hover:bg-border-color transition-colors">
            Options <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 w-56 rounded-2xl bg-bg-primary shadow-lg border border-border-color overflow-hidden',
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
              className
            )}
          >
            <div className="py-2 flex flex-col items-center justify-center">
              {items.map((item) => (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors',
                    item.disabled ? 'opacity-50 cursor-not-allowed text-text-tertiary' : 'hover:bg-bg-secondary',
                    item.danger && !item.disabled ? 'text-error hover:bg-error/10' : 'text-text-primary'
                  )}
                >
                  {item.icon && <span className={cn(item.danger ? 'text-error' : 'text-text-secondary')}>{item.icon}</span>}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
