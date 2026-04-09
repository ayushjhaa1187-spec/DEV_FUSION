'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { Users, Plus, MessageSquare, Shield, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function StudyGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function loadData() {
      try {
        const [groupsRes, membersRes] = await Promise.all([
          supabase.from('study_groups').select('*, profiles(username), subjects(name)'),
          user ? supabase.from('study_group_members').select('group_id').eq('user_id', user.id) : { data: [] }
        ]);
        
        setGroups(groupsRes.data || []);
        setMyGroups(membersRes.data?.map(m => m.group_id) || []);
      } catch (err) {
        console.error('Failed to load study groups');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, supabase]);

  const handleJoin = async (groupId: string) => {
    if (!user) return alert('Please log in to join groups');
    try {
      const { error } = await supabase.from('study_group_members').insert({
        group_id: groupId,
        user_id: user.id
      });
      if (!error) setMyGroups([...myGroups, groupId]);
    } catch (err) {
      alert('Join failed');
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Collaborative Learning</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Study Groups</h1>
            <p className="text-gray-400 mt-2 max-w-xl">
              Join focused learning circles, share resources in real-time, and tackle tough subjects together.
            </p>
          </div>
          
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/10 active:scale-95">
            <Plus className="w-5 h-5" />
            Create Circle
          </button>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {groups.length > 0 ? groups.map((group, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={group.id}
                className="group relative bg-[#1e1e2e] border border-gray-800 p-8 rounded-[40px] hover:border-emerald-500/30 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  {group.is_private ? <Lock className="w-4 h-4 text-gray-600" /> : <Globe className="w-4 h-4 text-gray-600" />}
                </div>

                <h3 className="text-2xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">{group.name}</h3>
                <p className="text-gray-500 text-sm mb-8 line-clamp-2">{group.description || 'Collaborative learning group for peer support.'}</p>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#1e1e2e]" />
                    ))}
                    <div className="w-8 h-8 rounded-full bg-emerald-900 border-2 border-[#1e1e2e] flex items-center justify-center text-[10px] font-black">+12</div>
                  </div>
                  <span className="text-xs font-bold text-gray-500">Active Learners</span>
                </div>

                {myGroups.includes(group.id) ? (
                  <Link 
                    href={`/community/groups/${group.id}`}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl block text-center transition-all border border-white/5"
                  >
                    Open Chat
                  </Link>
                ) : (
                  <button 
                    onClick={() => handleJoin(group.id)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all"
                  >
                    Join Circle
                  </button>
                )}
                
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="text-[10px] font-black uppercase tracking-tighter text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                     {group.subjects?.name || 'General'}
                   </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-8">
                  <Users className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">No circles yet — be the first to start!</h3>
                <p className="max-w-md mx-auto text-sm text-gray-400">
                  Study groups are more effective than solo learning. Create a circle and invite your peers to grow together.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
