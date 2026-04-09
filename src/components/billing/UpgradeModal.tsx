'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap, ArrowRight, ShieldCheck, Globe, Cpu } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userId: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, userEmail, userId }) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 199, type: 'subscription', entityId: userId }),
      });
      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillBridge Pro',
        description: 'Monthly Subscription',
        order_id: order.id,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              type: 'subscription',
              entity_id: userId
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert('Welcome to Pro Tier!');
            onClose();
            window.location.reload();
          }
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: '#6366f1',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Upgrade Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { name: 'AI Interviews', free: '5 / month', pro: 'Unlimited', icon: Cpu },
    { name: 'Practice Questions', free: '10 / day', pro: 'Unlimited', icon: Globe },
    { name: 'Expert Mentor Access', free: 'Standard', pro: 'Priority', icon: Zap },
    { name: 'Premium Badges', free: 'Basic', pro: 'Exclusive', icon: ShieldCheck },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#1e1e2e] border border-gray-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl"
          >
            <div className="flex flex-col md:flex-row">
              {/* Pricing Cards */}
              <div className="flex-1 p-8 bg-[#1e1e2e]">
                <h2 className="text-3xl font-bold text-white mb-2">Upgrade to Pro</h2>
                <p className="text-gray-400 mb-8">Unlock the full power of AI-driven learning.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Free Tier */}
                  <div className="p-6 rounded-2xl border border-gray-800 bg-[#161623] hover:border-gray-700 transition-colors">
                    <h3 className="text-lg font-medium text-gray-300">Free Tier</h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-4xl font-bold text-white">₹0</span>
                      <span className="ml-2 text-gray-500">/month</span>
                    </div>
                    <ul className="mt-6 space-y-4">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-400">
                          <Check className="w-4 h-4 text-emerald-500 mr-2" />
                          <span>{f.free} {f.name}</span>
                        </li>
                      ))}
                    </ul>
                    <button className="mt-8 w-full py-3 rounded-xl bg-gray-800 text-gray-300 font-medium cursor-default">
                      Current Plan
                    </button>
                  </div>

                  {/* Pro Tier */}
                  <div className="relative p-6 rounded-2xl border-2 border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors group">
                    <div className="absolute top-0 right-0 mt-4 mr-4 px-2 py-1 bg-indigo-500 text-[10px] font-bold text-white rounded uppercase tracking-wider">
                      Best Value
                    </div>
                    <h3 className="text-lg font-medium text-indigo-300">Pro Tier</h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-4xl font-bold text-white">₹199</span>
                      <span className="ml-2 text-indigo-400">/month</span>
                    </div>
                    <ul className="mt-6 space-y-4">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-center text-sm text-white">
                          <Check className="w-4 h-4 text-indigo-500 mr-2" />
                          <span>{f.pro} {f.name}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="mt-8 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                    >
                      {loading ? 'Processing...' : (
                        <>
                          Upgrade Now
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="w-full md:w-80 bg-[#161623] p-8 border-l border-gray-800">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Comparison</h4>
                <div className="space-y-6">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <f.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{f.name}</p>
                        <p className="text-xs text-gray-500">{f.pro} access</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-4 rounded-xl bg-gray-800/20 border border-gray-800/50">
                  <p className="text-xs text-gray-500 text-center">
                    Secure payment powered by Razorpay. Cancel anytime from your settings.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
