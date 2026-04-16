'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CreditCard, ChevronRight, CheckCircle2, Sparkles, Rocket, Zap, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import CouponWidget from '@/components/billing/CouponWidget';
import { toast } from 'sonner';
import Link from 'next/link';
import Script from 'next/script';

function UpgradeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createSupabaseBrowser();
  
  const plan = searchParams.get('plan') || 'pro';
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const planDetails = {
    pro: { name: 'Pro', price: '149', icon: Rocket, color: 'text-indigo-400' },
    elite: { name: 'Elite', price: '349', icon: Zap, color: 'text-amber-400' },
  }[plan as 'pro' | 'elite'] || { name: 'Pro', price: '149', icon: Rocket, color: 'text-indigo-400' };

  const handleUpgrade = async () => {
    if (!user) {
      toast.error('Identity authentication required.');
      return;
    }

    setIsProcessing(true);
    
    // Simulate Razorpay latency
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      // 1. Update/Insert into subscriptions
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: plan,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        });

      if (subError) throw subError;

      // 2. Also award some bonus credits for upgrading
      const { error: walletError } = await supabase.rpc('increment_credits', {
        p_user_id: user.id,
        p_amount: plan === 'elite' ? 1000 : 250
      });

      setIsSuccess(true);
      toast.success(`${planDetails.name} Access Activated!`);
    } catch (err: any) {
      toast.error(`Neural Link Failure: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto text-center py-20"
      >
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
        <h1 className="text-4xl font-black mb-4">Neural Link Established.</h1>
        <p className="text-gray-400 mb-10 font-medium">Your account has been upgraded to <span className={planDetails.color}>{planDetails.name}</span> status. All professional features are now unlocked.</p>
        
        <div className="flex flex-col gap-4">
          <Link href="/dashboard" className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform">
            Go to Dashboard
          </Link>
          <button onClick={() => router.push('/settings')} className="text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
            View Subscription Details
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 py-12">
      {/* Plan Summary */}
      <div className="space-y-8">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft size={14} /> Back to Pricing
        </Link>
        
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-4">Confirm <br /> Subscription</h1>
          <p className="text-gray-500 font-medium">You are upgrading to the high-performance {planDetails.name} tier.</p>
        </div>

        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <planDetails.icon size={120} />
          </div>
          <div className="relative z-10">
            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${planDetails.color}`}>Plan Selected</div>
            <h2 className="text-3xl font-black mb-6">{planDetails.name} Edition</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm py-3 border-b border-white/5">
                <span className="text-gray-500">Subscription Fee</span>
                <span className="font-bold">₹{planDetails.price}</span>
              </div>
              <div className="flex justify-between text-sm py-3 border-b border-white/5 text-emerald-400 font-bold">
                <span>Activation Tax</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between text-lg py-4 font-black">
                <span>Total Due</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">₹{planDetails.price}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <p className="text-[10px] text-indigo-300 font-bold leading-relaxed">Secure Neural Link Encryption enabled via SkillBridge Gateway.</p>
            </div>
          </div>
        </div>

        <CouponWidget onSuccess={() => setIsSuccess(true)} />
      </div>

      {/* Payment Simulation */}
      <div className="flex flex-col justify-center">
        <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden shadow-2xl">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <CreditCard className="text-white w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Razorpay Simulation</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           </div>

           <div className="space-y-6 mb-10">
              <div>
                 <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-2">Neural Card UID</label>
                 <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-gray-500 font-mono text-sm">
                    **** **** **** 8888
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-2">Expiry</label>
                   <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-gray-500 font-mono text-sm">
                      12/28
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-2">CVV</label>
                   <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-gray-500 font-mono text-sm">
                      ***
                   </div>
                </div>
              </div>
           </div>

           <button 
             onClick={handleUpgrade}
             disabled={isProcessing}
             className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-600/30 transition-all group flex items-center justify-center gap-3"
           >
             {isProcessing ? (
               <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
             ) : (
               <>Confirm Payment <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
             )}
           </button>
           
           <p className="text-[9px] text-gray-600 text-center mt-6 font-bold uppercase tracking-widest">
             By proceeding, you agree to the SkillBridge Neural Terms of Service.
           </p>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[150px]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-20 gap-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Initializing Secure Gateway...</p>
          </div>
        }>
          <UpgradeContent />
        </Suspense>
      </div>
    </div>
  );
}
