import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { session_fee, default_meeting_link, availability_rules } = await req.json();

    if (session_fee < 0 || session_fee > 500) {
        return NextResponse.json({ success: false, error: 'Session fee must be between 0 and 500 INR.' }, { status: 400 });
    }

    // 1. Verify user is an approved mentor and update mentor_profiles
    const { data: updatedProfile, error: profileError } = await supabase
        .from('mentor_profiles')
        .update({ 
            session_fee, 
            default_meeting_link,
            price_per_session: session_fee // Backwards compatibility just in case
        })
        .eq('user_id', user.id)
        .select('id')
        .single();

    if (profileError || !updatedProfile) {
        throw new Error(profileError?.message || 'Failed to update mentor profile');
    }

    const mentorId = updatedProfile.id;

    // 2. Clear old availability rules
    const { error: deleteError } = await supabase
        .from('availability_rules')
        .delete()
        .eq('mentor_id', mentorId);

    if (deleteError) throw deleteError;

    // 3. Insert new availability rules
    if (availability_rules && availability_rules.length > 0) {
        const rulesToInsert = availability_rules.map((rule: any) => ({
            mentor_id: mentorId,
            day_of_week: rule.day_of_week,
            start_time: rule.start_time,
            end_time: rule.end_time
        }));

        const { error: insertError } = await supabase
            .from('availability_rules')
            .insert(rulesToInsert);

        if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });

  } catch (error: any) {
    console.error('Mentor settings update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
