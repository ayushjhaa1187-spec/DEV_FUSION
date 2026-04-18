import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServer();
  const mentorId = params.id;
  const searchParams = req.nextUrl.searchParams;
  const dateStr = searchParams.get('date'); // YYYY-MM-DD

  if (!mentorId || !dateStr) {
    return NextResponse.json({ success: false, error: 'Missing mentorId or date' }, { status: 400 });
  }

  try {
    // 1. Fetch slots from availability_slots table
    const startOfDay = new Date(dateStr);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(dateStr);
    endOfDay.setUTCHours(23,59,59,999);

    const { data: slots, error: slotsError } = await supabase
      .from('availability_slots')
      .select('id, start_time')
      .eq('mentor_id', mentorId)
      .eq('status', 'available')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .gt('start_time', new Date().toISOString()) // Future only
      .order('start_time', { ascending: true });

    if (slotsError) throw slotsError;

    return NextResponse.json({ 
      success: true, 
      slots: slots?.map(s => ({ id: s.id, start_time: s.start_time })) || [] 
    });
  } catch (error: any) {
    console.error('Fetch slots error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
