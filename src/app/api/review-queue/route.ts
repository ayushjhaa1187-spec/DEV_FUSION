import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import {
  getPendingReviewItems,
  getAllReviewItems,
  getReviewStats,
} from '@/lib/review-queue';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'pending'; // 'pending' or 'all'
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let items;
    if (view === 'pending') {
      items = await getPendingReviewItems(user.id, limit);
    } else {
      items = await getAllReviewItems(user.id);
    }

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Review queue fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, queueId, score, concept, subject } = await req.json();

    if (action === 'get-stats') {
      const stats = await getReviewStats(user.id);
      return NextResponse.json(stats);
    }

    if (action === 'complete') {
      if (!queueId || score === undefined) {
        return NextResponse.json(
          { error: 'Missing queueId or score' },
          { status: 400 }
        );
      }

      // Verify ownership
      const { data: item } = await supabase
        .from('review_queue')
        .select('id')
        .eq('id', queueId)
        .eq('student_id', user.id)
        .single();

      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      // Import here to avoid circular deps
      const { completeReviewItem } = await import('@/lib/review-queue');
      await completeReviewItem(queueId, user.id, score);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Review queue POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
