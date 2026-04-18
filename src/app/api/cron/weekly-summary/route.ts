import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWeeklySummaryEmail } from '@/lib/email';

/**
 * GET /api/cron/weekly-summary
 * Triggered weekly (e.g., Sunday night) to send a digest to all active students.
 */
export async function GET(req: NextRequest) {
  // Simple auth check via secret header
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // 1. Fetch all active students who should receive the digest
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, email, subjects')
      .eq('role', 'student')
      .eq('newsletter_subscribed', true)
      .not('email', 'is', null);

    if (userError) throw userError;

    // 2. Fetch recent doubts (all) to filter per user
    const { data: recentDoubts, error: doubtError } = await supabase
      .from('doubts')
      .select('id, title, created_at, subjects')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('votes', { ascending: false })
      .limit(50);

    if (doubtError) throw doubtError;

    const stats = { emails_sent: 0, errors: 0 };

    for (const user of users) {
      // 3. Filter doubts relevant to user subjects or just top popular ones
      const userSubjects = user.subjects || [];
      const relevant = recentDoubts.filter(d => 
        (d.subjects && Array.isArray(d.subjects) && d.subjects.some(s => userSubjects.includes(s))) ||
        recentDoubts.indexOf(d) < 5 // Always include top 5
      ).slice(0, 5);

      if (relevant.length > 0) {
        try {
          await sendWeeklySummaryEmail({
            to: user.email,
            name: user.full_name || user.email.split('@')[0],
            totalNewDoubts: recentDoubts.length,
            highlightDoubts: relevant.map(d => ({
              id: d.id,
              title: d.title,
              subjects: d.subjects || []
            })),
            unansweredCount: recentDoubts.filter(d => !d.accepted_answer_id).length
          });
          stats.emails_sent++;
        } catch (e) {
          console.error(`Failed to send weekly summary to ${user.email}:`, e);
          stats.errors++;
        }
      }
    }

    return NextResponse.json({ success: true, stats });
  } catch (err: any) {
    console.error('[CRON Weekly Summary] Error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
