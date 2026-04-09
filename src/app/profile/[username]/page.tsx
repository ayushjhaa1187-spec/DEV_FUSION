import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Edit2, BookOpen, MessageSquare, CalendarCheck, ClipboardList } from 'lucide-react';

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

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);

  if (!profile) notFound();

  const badgeConf = BADGE_CONFIG[profile.badge] ?? { label: profile.badge, color: 'bg-gray-100 text-gray-600', emoji: '🎟️' };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
              {profile.avatar
                ? <Image src={profile.avatar} alt={profile.name} width={96} height={96} className="object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-3xl text-white font-bold">{profile.name[0]}</div>
              }
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                <p className="text-gray-500 dark:text-gray-400">@{profile.username}</p>
              </div>
              {profile.is_owner && (
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badgeConf.color}`}>
                {badgeConf.emoji} {badgeConf.label}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{profile.reputation.toLocaleString()} reputation</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mt-2">{profile.college}</p>
            {profile.branch && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">{profile.branch}{profile.year ? ` · Year ${profile.year}` : ''}</p>
            )}
            {profile.bio && (
              <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<BookOpen className="w-6 h-6 text-blue-500" />} label="Doubts Asked" value={profile.doubts_asked} />
          <StatCard icon={<MessageSquare className="w-6 h-6 text-green-500" />} label="Answers Given" value={profile.answers_given} />
          <StatCard icon={<ClipboardList className="w-6 h-6 text-orange-500" />} label="Tests Taken" value={profile.tests_taken} />
          <StatCard icon={<CalendarCheck className="w-6 h-6 text-purple-500" />} label="Sessions Booked" value={profile.sessions_booked} />
        </div>

        {/* Badges Earned */}
        {profile.badges_earned.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Badges Earned</h2>
            <div className="flex flex-wrap gap-3">
              {profile.badges_earned.map((badge) => {
                const bc = BADGE_CONFIG[badge] ?? { label: badge, color: 'bg-gray-100 text-gray-600', emoji: '🎟️' };
                return (
                  <span key={badge} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${bc.color}`}>
                    {bc.emoji} {bc.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {profile.recent_activity.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {profile.recent_activity.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-gray-800 dark:text-gray-200 text-sm">{event.description}</p>
                    <p className="text-gray-400 text-xs">{formatDate(event.created_at)}</p>
                  </div>
                  <span className={`font-semibold text-sm ${event.points >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center text-center">
      {icon}
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{label}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
