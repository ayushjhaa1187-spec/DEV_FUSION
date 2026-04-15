import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * /api/dashboard/stats
 * Consolidated endpoint for Lean MVP Dashboard.
 * Fetches profile, aggregated stats, and recent activity in a single round-trip.
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parallel fetch for primary data vectors
    const [profileRes, doubtsCount, answersCount, activityRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('doubts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      supabase.from('answers').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      // Combined recent activity
      Promise.all([
        supabase.from('doubts').select('id, title, created_at').eq('author_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('answers').select('id, doubt:doubts(title), created_at, is_accepted').eq('author_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])
    ]);

    if (profileRes.error) throw profileRes.error;

    // Flatten and sort recent activity with explicit titles
    const recentActivity = [
      ...(activityRes[0].data || []).map(d => ({ 
        type: 'doubt', 
        id: d.id, 
        title: "You asked a doubt", 
        subtitle: d.title,
        date: d.created_at 
      })),
      ...(activityRes[1].data || []).map(a => ({ 
        type: a.is_accepted ? 'accepted' : 'answer', 
        id: a.id, 
        title: a.is_accepted ? "Your answer was accepted" : "You answered a question", 
        subtitle: a.doubt?.title || 'Unknown Doubt',
        date: a.created_at 
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        profile: profileRes.data,
        stats: {
          doubts: doubtsCount.count || 0,
          answers: answersCount.count || 0,
          reputation: profileRes.data.reputation_points || 0
        },
        recent_activity: recentActivity
      }
    });

  } catch (error: any) {
    console.error('[GET /api/dashboard/stats] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
