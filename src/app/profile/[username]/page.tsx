import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Edit2, BookOpen, MessageSquare, CalendarCheck, ClipboardList, Video, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';
import PerformanceChart from './PerformanceChart';

const BADGE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  Newcomer: { label: 'Newcomer', color: 'bg-gray-100 text-gray-700', emoji: '🌱' },
  Helper: { label: 'Helper', color: 'bg-blue-100 text-blue-700', emoji: '💡' },
  Expert: { label: 'Expert', color: 'bg-purple-100 text-purple-700', emoji: '🤓' },
  Legend: { label: 'Legend', color: 'bg-yellow-100 text-yellow-700', emoji: '🏆' },
};

type Profile = {
  id: string;
  username: string;
  name: string;
  college: string;
  branch?: string;
  year?: number;
  bio?: string;
  avatar?: string;
  badge: string;
  reputation: number;
  doubts_asked: number;
  answers_given: number;
  tests_taken: number;
  sessions_booked: number;
  badges_earned: string[];
  recent_activity: ReputationEvent[];
  is_owner: boolean;
};

type ReputationEvent = {
  id: string;
  type: string;
  description: string;
  points: number;
  created_at: string;
};

async function getProfile(username: string): Promise<Profile | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/profile/${username}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: 'User Not Found | DEV_FUSION' };

  return {
    title: `${profile.name} (@${profile.username}) | DEV_FUSION`,
    description: profile.bio || `Academic profile of ${profile.name} on DEV_FUSION.`,
    openGraph: {
      title: `${profile.name} (@${profile.username}) | DEV_FUSION`,
      description: profile.bio || `Academic profile of ${profile.name} on DEV_FUSION.`,
      images: profile.avatar ? [{ url: profile.avatar }] : []
    }
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) notFound();

  const badgeConf = BADGE_CONFIG[profile.badge] ?? { label: profile.badge, color: 'bg-gray-100 text-gray-600', emoji: '🎟️' };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d1a] p-6 text-white">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Profile Header */}
        <div className="bg-white dark:bg-[#13132b] border border-white/5 rounded-2xl shadow p-6 flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-white/5 overflow-hidden flex-shrink-0 border-2 border-indigo-500/20">
              {profile.avatar
                ? <Image src={profile.avatar} alt={profile.name} width={96} height={96} className="object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-3xl text-white font-black">{profile.name[0]}</div>
              }
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{profile.name}</h1>
                <p className="text-gray-500 dark:text-indigo-400 font-bold">@{profile.username}</p>
              </div>
              {profile.is_owner && (
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeConf.color}`}>
                {badgeConf.emoji} {badgeConf.label}
              </span>
              <span className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">{profile.reputation.toLocaleString()} reputation</span>
            </div>
            <p className="text-gray-500 font-bold text-sm mt-4">{profile.college}</p>
            {profile.branch && (
              <p className="text-gray-500 dark:text-gray-600 text-[10px] font-bold uppercase tracking-widest">{profile.branch}{profile.year ? ` · Year ${profile.year}` : ''}</p>
            )}
            {profile.bio && (
              <p className="mt-4 text-gray-400 text-sm leading-relaxed italic">"{profile.bio}"</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<BookOpen className="w-6 h-6 text-indigo-500" />} label="Doubts Asked" value={profile.doubts_asked} />
          <StatCard icon={<MessageSquare className="w-6 h-6 text-emerald-500" />} label="Answers Given" value={profile.answers_given} />
          <StatCard icon={<ClipboardList className="w-6 h-6 text-amber-500" />} label="Tests Taken" value={profile.tests_taken} />
          <StatCard icon={<CalendarCheck className="w-6 h-6 text-purple-500" />} label="Sessions Booked" value={profile.sessions_booked} />
        </div>

        {/* Growth Curve */}
        <PerformanceChart username={username} />

        {/* Mentor CTA (If applicable) */}
        {profile.id && profile.is_owner === false && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-500/20">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Book a 1:1 Guided Session</h3>
              <p className="text-indigo-100/70 text-sm font-medium">Get direct mentorship, resume reviews, or technical coaching from @{profile.username}.</p>
            </div>
            <Link 
              href={`/mentors/${profile.id}/book`}
              className="flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition active:scale-95 shadow-lg"
            >
              <Video className="w-5 h-5" /> Book Now <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Badges Earned */}
        {profile.badges_earned.length > 0 && (
          <div className="bg-white dark:bg-[#13132b] border border-white/5 rounded-2xl shadow p-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">Badges Earned</h2>
            <div className="flex flex-wrap gap-3">
              {profile.badges_earned.map((badge) => {
                const bc = BADGE_CONFIG[badge] ?? { label: badge, color: 'bg-gray-100 text-gray-600', emoji: '🎟️' };
                return (
                  <span key={badge} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${bc.color}`}>
                    {bc.emoji} {bc.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {profile.recent_activity.length > 0 && (
          <div className="bg-white dark:bg-[#13132b] border border-white/5 rounded-2xl shadow p-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">Recent Activity</h2>
            <div className="space-y-3">
              {profile.recent_activity.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <div>
                    <p className="text-gray-300 text-sm font-medium">{event.description}</p>
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-1">{formatDate(event.created_at)}</p>
                  </div>
                  <span className={`font-black text-sm ${event.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {event.points >= 0 ? '+' : ''}{event.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-[#13132b] border border-white/5 rounded-2xl shadow p-6 flex flex-col items-center text-center">
      <div className="mb-4">{icon}</div>
      <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
      <p className="text-gray-500 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mt-2">{label}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
