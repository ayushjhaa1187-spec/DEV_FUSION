import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { z } from 'zod';

const querySchema = z.object({
  limit: z.string().optional().transform(v => parseInt(v || '5')),
  offset: z.string().optional().transform(v => parseInt(v || '0')),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const { limit, offset } = querySchema.parse(Object.fromEntries(searchParams));

    const supabase = await createSupabaseServer();

    // Resolve mentor_profiles.id from id (which could be user_id or mentor_profile.id)
    const { data: mentorProfile } = await supabase
      .from('mentor_profiles')
      .select('id')
      .or(`id.eq.${id},user_id.eq.${id}`)
      .single();

    if (!mentorProfile) {
      return NextResponse.json({ reviews: [], total: 0 });
    }

    // Fetch reviews from confirmed/completed bookings where review exists
    const { data, error, count } = await supabase
      .from('bookings')
      .select(`
        id,
        review_text,
        review_rating,
        created_at,
        profiles!student_id (
          username,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('mentor_id', mentorProfile.id)
      .not('review_text', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      reviews: data,
      total: count || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Mentor reviews error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
