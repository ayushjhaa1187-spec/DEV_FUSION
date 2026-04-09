import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import styles from './analytics.module.css';
import { Users, HelpCircle, Video, GraduationCap, ArrowUpRight } from 'lucide-react';

export default async function AdminAnalyticsPage() {
  const supabase = await createSupabaseServer();
  
  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  // Stats fetching
  const [
    { count: totalUsers },
    { count: totalDoubts },
    { count: totalSessions },
    { data: testData }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('doubts').select('*', { count: 'exact', head: true }),
    supabase.from('mentor_bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('practice_attempts').select('score, practice_tests(topic, subjects(name))')
  ]);

  // Aggregate Subject Performance
  const subjectAgg: Record<string, { total: number, count: number }> = {};
  testData?.forEach((attempt: any) => {
    const sName = attempt.practice_tests?.subjects?.name || 'General';
    if (!subjectAgg[sName]) subjectAgg[sName] = { total: 0, count: 0 };
    subjectAgg[sName].total += attempt.score;
    subjectAgg[sName].count += 1;
  });

  const topSubjects = Object.entries(subjectAgg)
    .map(([name, stat]) => ({ name, avg: Math.round(stat.total / stat.count) }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>System <span>Intelligence</span></h1>
        <p className={styles.subtitle}>Real-time oversight of SkillBridge platform growth and academic health.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon}><Users size={24} /></div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Students</span>
            <div className={styles.statValue}>{totalUsers}</div>
          </div>
        </div>
        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ color: '#8b5cf6' }}><HelpCircle size={24} /></div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Doubts Raised</span>
            <div className={styles.statValue}>{totalDoubts}</div>
          </div>
        </div>
        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ color: '#06d6a0' }}><Video size={24} /></div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Sessions Held</span>
            <div className={styles.statValue}>{totalSessions}</div>
          </div>
        </div>
        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ color: '#f59e0b' }}><GraduationCap size={24} /></div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Quiz Assertions</span>
            <div className={styles.statValue}>{testData?.length || 0}</div>
          </div>
        </div>
      </div>

      <section className={styles.performanceSection}>
        <div className={styles.sectionHeader}>
          <h2>Subject Mastery Overviews</h2>
          <span className={styles.badge}>Live Metrics</span>
        </div>
        
        <div className={styles.performanceGrid}>
          {topSubjects.length > 0 ? topSubjects.map((s, i) => (
             <div key={i} className={`${styles.perfCard} glass`}>
                <div className={styles.perfTop}>
                  <span className={styles.sName}>{s.name}</span>
                  <div className={styles.trend}><ArrowUpRight size={14} /> Higher</div>
                </div>
                <div className={styles.perfValue}>{s.avg}%</div>
                <div className={styles.pLabel}>Avg Score</div>
                <div className={styles.progressBar}><div style={{ width: `${s.avg}%` }} /></div>
             </div>
          )) : (
            <div className={styles.empty}>No practice data recorded yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
