'use client';

import React, { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { CreditCard, History, CheckCircle2, XCircle, Clock } from 'lucide-react';
import UpgradeModal from '@/components/billing/UpgradeModal';

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profile);

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      setTransactions(txs || []);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Billing & Subscription
            </h1>
            <p className="text-gray-400 mt-2">Manage your plan and view transaction history.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-[#1e1e2e] p-4 rounded-2xl border border-gray-800">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Plan</p>
              <p className="text-xl font-bold text-indigo-400 capitalize">{profile?.subscription_tier || 'Free'}</p>
            </div>
            {profile?.subscription_tier !== 'pro' && (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Subscription Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#1e1e2e] border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Subscription</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="text-emerald-500 font-medium">Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Next Billing</span>
                  <span className="text-white">N/A (Free)</span>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <button className="text-sm text-gray-400 hover:text-white transition-colors">
                    Manage Payment Method
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="lg:col-span-2">
            <div className="bg-[#1e1e2e] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-bold">Billing History</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#161623] text-xs text-gray-500 uppercase font-bold">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-6 py-4 bg-gray-800/10 h-12"></td>
                        </tr>
                      ))
                    ) : transactions.length > 0 ? (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {format(new Date(tx.created_at), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-white">
                            {tx.type === 'subscription' ? 'Pro Plan Monthly' : 'Mentor Session'}
                          </td>
                          <td className="px-6 py-4 text-sm text-white">
                            ₹{(tx.amount / 100).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs capitalize text-gray-400">
                              {getStatusIcon(tx.status)}
                              {tx.status}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)}
        userEmail={user?.email || ''}
        userId={user?.id || ''}
      />
    </div>
  );
}
