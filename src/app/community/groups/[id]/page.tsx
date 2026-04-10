'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Send, Hash, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LoadingPage } from '@/components/ui/Loading';

export default function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    if (!user) return;

    // 1. Initial Load
    const loadGroup = async () => {
      const { data: groupData } = await supabase.from('study_groups').select('*, profiles(username)').eq('id', id).single();
      const { data: msgData } = await supabase.from('study_group_messages').select('*, profiles:sender_id(username, avatar_url)').eq('group_id', id).order('created_at', { ascending: true });
      const { data: memData } = await supabase.from('study_group_members').select('*, profiles:user_id(username, avatar_url)').eq('group_id', id);

      setGroup(groupData);
      setMessages(msgData || []);
      setMembers(memData || []);
    };
    loadGroup();

    // 2. Realtime Subscription
    const channel = supabase
      .channel(`group-chat:${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'study_group_messages',
        filter: `group_id=eq.${id}`
      }, async (payload) => {
        // Fetch profile info for the new message
        const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.sender_id).single();
        const fullMsg = { ...payload.new, profiles: profile };
        setMessages(prev => [...prev, fullMsg]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgContent = newMessage;
    setNewMessage('');

    const { error } = await supabase.from('study_group_messages').insert({
      group_id: id,
      sender_id: user.id,
      content: msgContent
    });

    if (error) {
      console.error('Send failed', error);
      setNewMessage(msgContent); // Restore on failure
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!group) return <LoadingPage text="Connecting to Circle..." />;

  return (
    <main className="h-screen bg-[#0f0f1a] flex flex-col pt-[72px]">
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`fixed inset-0 z-50 md:relative md:flex w-64 bg-[#161623] border-r border-gray-800 flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
             <div className="flex flex-col">
               <Link href="/community/groups" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold mb-4">
                 <ArrowLeft className="w-4 h-4" />
                 Back
               </Link>
               <h2 className="text-xl font-black">{group.name}</h2>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-500">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
             <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                <Users className="w-3 h-3" />
                Members — {members.length}
             </div>
             <div className="space-y-3">
                {members.map((m: any) => (
                  <div key={m.user_id} className="flex items-center gap-3">
                    <img src={m.profiles.avatar_url || `https://ui-avatars.com/api/?name=${m.profiles.username}`} className="w-8 h-8 rounded-full border border-gray-800" alt="" />
                    <span className="text-sm font-medium text-gray-300">{m.profiles.username}</span>
                  </div>
                ))}
             </div>
          </div>
        </aside>

        {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#0f0f1a]">
          {/* Mobile Chat Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between md:hidden bg-[#161623]/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Link href="/community/groups" className="text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
              <h2 className="text-lg font-black truncate max-w-[150px]">{group.name}</h2>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-indigo-600/10 text-indigo-500 rounded-xl">
              <Users className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col">
            {messages.map((msg, i) => (
              <div key={msg.id} className={`flex gap-3 md:gap-4 ${msg.sender_id === user?.id ? 'flex-row-reverse' : ''}`}>
                <img src={msg.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${msg.profiles?.username}`} className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex-shrink-0" alt="" />
                <div className={`max-w-[85%] md:max-w-[70%] ${msg.sender_id === user?.id ? 'items-end' : ''} flex flex-col`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] md:text-xs font-black text-gray-500">{msg.profiles?.username}</span>
                    <span className="text-[9px] md:text-[10px] text-gray-700">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl text-xs md:text-sm leading-relaxed ${msg.sender_id === user?.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#1e1e2e] text-gray-300 rounded-tl-none border border-gray-800'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          {/* Form */}
          <div className="p-6 bg-[#161623] border-t border-gray-800">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-4">
              <div className="flex-1 relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${group.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="w-full bg-[#0f0f1a] border border-gray-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500/50 transition-colors text-white"
                />
              </div>
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
