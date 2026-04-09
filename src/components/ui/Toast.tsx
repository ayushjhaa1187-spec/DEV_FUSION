'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[10001] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <div className={`
                flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border min-w-[320px] relative overflow-hidden
                ${toast.type === 'success' ? 'bg-[#062016] border-emerald-500/30 text-emerald-400' : 
                  toast.type === 'error' ? 'bg-[#20060b] border-red-500/30 text-red-400' : 
                  'bg-[#13132b] border-white/10 text-white'}
              `}>
                <div className="flex-shrink-0">
                  {toast.type === 'success' && <CheckCircle size={20} />}
                  {toast.type === 'error' && <AlertCircle size={20} />}
                  {toast.type === 'info' && <Info size={20} />}
                </div>
                <p className="text-sm font-bold flex-grow">{toast.message}</p>
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
                
                {/* Progress bar */}
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: 0 }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-[3px] ${
                    toast.type === 'success' ? 'bg-emerald-500' : 
                    toast.type === 'error' ? 'bg-red-500' : 
                    'bg-indigo-500'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
