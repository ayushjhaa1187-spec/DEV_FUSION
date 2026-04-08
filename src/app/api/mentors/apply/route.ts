import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { specialty, bio, hourly_rate, meeting_link } = await req.json();

    // Basic validation
    if (!specialty || !bio || hourly_rate === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (hourly_rate < 0 || hourly_rate > 500) {
      return NextResponse.json({ error: 'Fee must be between ₹0 and ₹500' }, { status: 400 });
    }

    // Check if application already exists
    const { data: existingApp } = await supabase
      .from('mentor_applications')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (existingApp && existingApp.status === 'pending') {
      return NextResponse.json({ error: 'Application already pending' }, { status: 400 });
    }

    // Insert into mentor_applications
    const { data, error } = await supabase
      .from('mentor_applications')
      .upsert({
        user_id: user.id,
        specialty,
        bio,
        hourly_rate,
        meeting_link,
        status: 'pending',
        applied_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Application submitted successfully', data });
  } catch (error: any) {
    console.error('Mentor Application Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
