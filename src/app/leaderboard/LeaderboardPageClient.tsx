'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Image from 'next/image';
import styles from './leaderboard.module.css';

const TABS = ['All-Time', 'Monthly', 'Weekly'];

const BADGE_CONFIG: Record<string, string> = {
  Newcomer: 'badgeNewcomer',
  Helper: 'badgeHelper',
  Expert: 'badgeExpert',
  Legend: 'badgeLegend',
};

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  name: string;
  username: string;
  college: string;
  avatar?: string;
  badge: string;
  points: number;
  change: number;
  is_current_user?: boolean;
};

async function fetchLeaderboard(period: string): Promise<{ entries: LeaderboardEntry[]; currentUser?: LeaderboardEntry }> {
  const res = await fetch(`/api/leaderboard?period=${period.toLowerCase().replace('-', '_')}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export default function LeaderboardPageClient() {
  const [activeTab, setActiveTab] = useState('All-Time');
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', activeTab],
    queryFn: () => fetchLeaderboard(activeTab),
    refetchInterval: 300_000,
  });

  const entries = data?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUser = data?.currentUser;
  const currentUserInTop20 = entries.some((e) => e.is_current_user);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Trophy className={styles.headerIcon} size={32} />
        <h1 className={styles.title}>Leaderboard</h1>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className={styles.skeleton}>
          <div className={styles.skeletonPodium} />
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {top3.length > 0 && (
            <div className={styles.podiumWrapper}>
              {top3[1] && <PodiumCard entry={top3[1]} position={2} />}
              {top3[0] && <PodiumCard entry={top3[0]} position={1} />}
              {top3[2] && <PodiumCard entry={top3[2]} position={3} />}
            </div>
          )}

          {rest.length > 0 && (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th>Rank</th>
                    <th>User</th>
                    <th>College</th>
                    <th>Badge</th>
                    <th>Points</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((entry) => <LeaderboardRow key={entry.user_id} entry={entry} />)}
                </tbody>
              </table>
            </div>
          )}

          {entries.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏆</div>
              <p className={styles.emptyText}>No leaderboard data yet.</p>
            </div>
          )}

          {currentUser && !currentUserInTop20 && (
            <div className={styles.currentUserBanner}>
              <span className={styles.currentUserRank}>{currentUser.rank}</span>
              {currentUser.avatar && (
                <Image src={currentUser.avatar} alt={currentUser.name} width={36} height={36} style={{ borderRadius: '50%' }} />
              )}
              <span className={styles.currentUserName}>{currentUser.name} <span style={{ opacity: 0.6, fontSize: '0.85em' }}>(You)</span></span>
              <span className={styles.currentUserPoints}>{currentUser.points.toLocaleString()} pts</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PodiumCard({ entry, position }: { entry: LeaderboardEntry; position: number }) {
  const heights: Record<number, string> = { 1: '128px', 2: '96px', 3: '80px' };
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <div className={styles.podiumCard}>
      <div className={styles.podiumMedal}>{medals[position]}</div>
      {entry.avatar ? (
        <Image src={entry.avatar} alt={entry.name} width={48} height={48} className={styles.podiumAvatar} />
      ) : (
        <div className={styles.podiumAvatarPlaceholder}>{entry.name[0]}</div>
      )}
      <div>
        <p className={styles.podiumName}>{entry.name}</p>
        <p className={styles.podiumPoints}>{entry.points.toLocaleString()} pts</p>
      </div>
      <div className={styles.podiumBase} style={{ height: heights[position] }}>
        <span className={styles.podiumRank}>#{position}</span>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <tr className={`${styles.tableRow} ${entry.is_current_user ? styles.tableRowHighlight : ''}`}>
      <td className={styles.rankCell}>{entry.rank}</td>
      <td>
        <div className={styles.userCell}>
          {entry.avatar && <Image src={entry.avatar} alt={entry.name} width={32} height={32} className={styles.userAvatar} />}
          <div>
            <span className={styles.userName}>{entry.name}</span>
            {entry.is_current_user && <span className={styles.userYou}>(You)</span>}
            <p className={styles.userHandle}>@{entry.username}</p>
          </div>
        </div>
      </td>
      <td className={styles.collegeCell}>{entry.college}</td>
      <td><BadgeChip badge={entry.badge} /></td>
      <td className={styles.pointsCell}>{entry.points.toLocaleString()}</td>
      <td className={styles.changeCell}><ChangeIndicator change={entry.change} /></td>
    </tr>
  );
}

function BadgeChip({ badge }: { badge: string }) {
  const cls = BADGE_CONFIG[badge] ?? 'badgeNewcomer';
  return <span className={`${styles.badge} ${styles[cls as keyof typeof styles]}`}>{badge}</span>;
}

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) return <span className={styles.changeUp}><TrendingUp size={12} />+{change}</span>;
  if (change < 0) return <span className={styles.changeDown}><TrendingDown size={12} />{change}</span>;
  return <span className={styles.changeNeutral}><Minus size={12} /></span>;
}
