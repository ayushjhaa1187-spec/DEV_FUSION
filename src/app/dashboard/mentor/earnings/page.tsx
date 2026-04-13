"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

type Payout = {
  id: string;
  booking_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid';
  created_at: string;
  paid_at: string | null;
};

export default function MentorEarningsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const res = await fetch('/api/mentors/payouts');
        const data = await res.json();
        if (data.payouts) {
          setPayouts(data.payouts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayouts();
  }, []);

  const handleWithdraw = async (payoutId: string) => {
    setRequesting(payoutId);
    try {
      const res = await fetch('/api/mentors/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payoutId })
      });
      const data = await res.json();
      if (res.ok) {
        setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: 'processing' } : p));
      } else {
        alert(data.error);
      }
    } catch (err) {
        console.error(err);
    } finally {
        setRequesting(null);
    }
  };

  const totalEarnings = payouts.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const pendingEarnings = payouts.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);

  if (loading) {
    return <div className="text-white text-center p-12">Loading earnings data...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Earnings Dashboard</h1>
        <p className="text-gray-400">Track your mentorship sessions income and manage payouts.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#13132b] border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <CheckCircle className="w-32 h-32 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Total Paid Earnings</p>
            <div className="flex items-center gap-2 mt-4 text-white">
                <IndianRupee className="w-8 h-8 text-emerald-400" />
                <span className="text-5xl font-black">{totalEarnings}</span>
            </div>
        </div>

        <div className="bg-[#13132b] border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Clock className="w-32 h-32 text-amber-400" />
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Available to Withdraw</p>
            <div className="flex items-center gap-2 mt-4 text-white">
                <IndianRupee className="w-8 h-8 text-amber-400" />
                <span className="text-5xl font-black">{pendingEarnings}</span>
            </div>
        </div>
      </div>

      <div className="bg-[#13132b] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <TrendingUp className="text-gray-400 w-5 h-5" />
          <h3 className="text-lg font-bold text-white">Ledger History</h3>
        </div>
        
        <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/[0.02] text-xs uppercase font-bold tracking-widest border-b border-white/5">
                <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {payouts.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="text-center p-8 text-gray-500">No earnings recorded yet.</td>
                    </tr>
                ) : (
                    payouts.map(p => (
                        <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-white">
                                {new Date(p.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">{p.booking_id.substring(0, 8)}...</td>
                            <td className="px-6 py-4 font-medium text-white flex items-center">
                                ₹{p.amount}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                                    ${p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                                    ${p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : ''}
                                    ${p.status === 'processing' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                                `}>
                                    {p.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {p.status === 'pending' && (
                                    <button 
                                        onClick={() => handleWithdraw(p.id)}
                                        disabled={requesting === p.id}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {requesting === p.id ? 'Processing...' : 'Withdraw'}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
