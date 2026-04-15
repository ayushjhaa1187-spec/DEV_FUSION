'use client';

import { useState } from 'react';
import { Ticket, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function CouponWidget() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<{ plan: string, message: string } | null>(null);

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid coupon or logic error');
      }

      setApplied({ plan: data.plan, message: data.message });
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-600/10 blur-[80px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Ticket size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest">Apply Access Key</h3>
            <p className="text-[10px] text-gray-500 font-medium">Unlock Pro or Elite scholarship benefits.</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!applied ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                  placeholder="CODE (e.g. JAHNVI_FIND)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-black tracking-widest outline-none focus:border-indigo-500/50 transition-all placeholder:text-gray-700"
                />
              </div>
              <button 
                onClick={applyCoupon}
                disabled={loading || !code.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2 group/btn"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 items-center"
            >
              <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
              <div>
                <p className="text-emerald-400 text-xs font-black uppercase tracking-wider">Plan Activated</p>
                <p className="text-emerald-200/60 text-[10px] leading-tight font-medium mt-0.5">{applied.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center">
            <AlertCircle size={10} /> Limits automatically increase after activation
          </p>
        </div>
      </div>
    </div>
  );
}
