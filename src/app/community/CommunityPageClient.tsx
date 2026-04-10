'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './community.module.css';

const topicCircles = [
  { name: 'DSA & CP', members: '2.4k', emoji: '🧠', href: '/community/groups' },
  { name: 'System Design', members: '1.8k', emoji: '⚙️', href: '/community/groups' },
  { name: 'Web Dev', members: '3.1k', emoji: '🌐', href: '/community/groups' },
  { name: 'GATE Prep', members: '4.2k', emoji: '📚', href: '/community/groups' },
  { name: 'Interview Prep', members: '2.9k', emoji: '💼', href: '/community/groups' },
  { name: 'Open Source', members: '1.2k', emoji: '🔓', href: '/community/groups' },
];

const activities = [
  { user: 'rahul_dev', action: 'answered a doubt in', target: 'Binary Trees', time: '2m ago', rep: '+15 XP' },
  { user: 'priya_cs22', action: 'joined the circle', target: 'System Design', time: '5m ago', rep: '+5 XP' },
  { user: 'arjun_bits', action: 'reached Gold tier', target: '', time: '10m ago', rep: '🥇' },
  { user: 'meera_nitk', action: 'asked a doubt in', target: 'OS Scheduling', time: '15m ago', rep: '' },
];

export default function CommunityPageClient() {
  return (
    <main className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.dot} />
          Live Community
        </div>
        <h1 className={styles.title}>
          Your Academic{' '}
          <span className={styles.titleAccent}>Tribe</span>
        </h1>
        <p className={styles.subtitle}>
          Connect with 10,000+ students from colleges across India. Learn together, solve together, grow together.
        </p>
      </div>

      {/* Study Circles Grid */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Study Circles</h2>
            <p className={styles.sectionSubtitle}>Real-time group chats organized by topic</p>
          </div>
          <Link href="/community/groups" className={styles.browseLink}>
            Browse All <ArrowRight size={16} />
          </Link>
        </div>
        <div className={styles.circlesGrid}>
          {topicCircles.map((circle) => (
            <Link key={circle.name} href={circle.href} className={styles.circleCard}>
              <span className={styles.circleEmoji}>{circle.emoji}</span>
              <p className={styles.circleName}>{circle.name}</p>
              <p className={styles.circleMembers}>{circle.members} members</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Live Activity</h2>
          <span className={styles.liveBadge}>● Live</span>
        </div>
        <div className={styles.activityFeed}>
          {activities.map((act, i) => (
            <div key={i} className={styles.activityItem}>
              <div className={styles.activityAvatar}>
                {act.user[0].toUpperCase()}
              </div>
              <div className={styles.activityText}>
                <span className={styles.activityUser}>@{act.user}</span>{' '}
                {act.action}{' '}
                {act.target && <span className={styles.activityTarget}>{act.target}</span>}
              </div>
              <span className={styles.activityTime}>{act.time}</span>
              {act.rep && <span className={styles.activityRep}>{act.rep}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Card */}
      <div className={styles.ctaCard}>
        <h3 className={styles.ctaTitle}>Start a Discussion</h3>
        <p className={styles.ctaText}>
          Got a concept that clicks? Share it. Got a doubt? Post it. The community is waiting.
        </p>
        <Link href="/doubts" className={styles.ctaButton}>
          Post to Doubt Feed
        </Link>
      </div>
    </main>
  );
}
