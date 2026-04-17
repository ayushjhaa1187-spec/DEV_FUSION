'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Phone, Globe, Send, CheckCircle2, Loader2, Sparkles, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [subject, setSubject] = useState('general');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setSuccess(true);
    toast.success('Inquiry sent successfully!');
  };

  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', background: '#09090b', color: '#fff', padding: '120px 24px' }}>
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          
          {/* Left Side: Info */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8">
              <Sparkles size={14} />
              <span>We're Here to Help</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
              Reach out to <span className="text-emerald-500">Mastery.</span>
            </h1>
            <p className="text-xl text-gray-400 font-medium mb-12 max-w-xl">
              Found an issue? Have a feature request? Or looking to join the mission? Our team is always ready to connect.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg">Support Email</h3>
                  <p className="text-gray-500 font-bold">support@skillbridge.academy</p>
                </div>
              </div>

              <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg">Careers Inquiry</h3>
                  <p className="text-gray-500 font-bold">careers@skillbridge.academy</p>
                </div>
              </div>

              <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg">Global HQ</h3>
                  <p className="text-gray-500 font-bold">Tech City, Innovation District</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-3xl relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full" />
            
            <AnimatePresence mode="wait">
              {!success ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleSubmit} 
                  className="relative z-10 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                      <input type="text" required placeholder="John Doe" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500/50 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                      <input type="email" required placeholder="john@example.com" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500/50 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Inquiry Type</label>
                    <select 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="general">General Support</option>
                      <option value="billing">Billing & Refund</option>
                      <option value="careers">Careers / Portfolio Submission</option>
                      <option value="partnership">Academic Partnership</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Message</label>
                    <textarea required rows={4} placeholder="How can we help you?" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500/50 transition-all resize-none" />
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all group"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        Send Inquiry <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-20"
                >
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8 border border-emerald-500/20">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-4xl font-black mb-4">Message Sent!</h2>
                  <p className="text-gray-400 font-medium max-w-sm">
                    We've received your inquiry. Our team will get back to you within 24 hours.
                  </p>
                  <button onClick={() => setSuccess(false)} className="mt-10 text-emerald-500 font-black uppercase tracking-widest text-xs hover:underline">
                    Send another message
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
