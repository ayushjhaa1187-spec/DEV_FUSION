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
    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getUTCDay(); // 0-6

    // 1. Get Availability Rules for the day
    const { data: rules, error: rulesError } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('mentor_id', mentorId)
      .eq('day_of_week', dayOfWeek);

    if (rulesError) throw rulesError;

    // 2. Get existing bookings for the day
    // We check for bookings that overlap with the selected UTC date by bounds
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23,59,59,999);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('start_timestamp, end_timestamp')
      .eq('mentor_id', mentorId)
      .in('payment_status', ['COMPLETED', 'FREE', 'PENDING'])
      .gte('start_timestamp', startOfDay.toISOString())
      .lte('start_timestamp', endOfDay.toISOString());

    if (bookingsError) throw bookingsError;

    // 3. Generate slots
    const availableSlots: string[] = []; // Array of ISO strings

    if (rules && rules.length > 0) {
      rules.forEach(rule => {
        const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
        const [endHours, endMinutes] = rule.end_time.split(':').map(Number);

        let currentSlot = new Date(targetDate);
        currentSlot.setUTCHours(startHours, startMinutes, 0, 0);

        const ruleEndTime = new Date(targetDate);
        ruleEndTime.setUTCHours(endHours, endMinutes, 0, 0);

        while (currentSlot < ruleEndTime) {
          const slotStart = new Date(currentSlot);
          const slotEnd = new Date(currentSlot.getTime() + 30 * 60000); // +30 mins

          if (slotEnd <= ruleEndTime) {
            // Check for conflict
            const isConflict = bookings?.some(booking => {
              const bStart = new Date(booking.start_timestamp);
              const bEnd = new Date(booking.end_timestamp || new Date(bStart.getTime() + 30 * 60000).toISOString());
              
              // Overlap logic: max(start1, start2) < min(end1, end2)
              return Math.max(slotStart.getTime(), bStart.getTime()) < Math.min(slotEnd.getTime(), bEnd.getTime());
            });

            // Make sure the slot is in the future
            if (!isConflict && slotStart.getTime() > Date.now()) {
              availableSlots.push(slotStart.toISOString());
            }
          }
          currentSlot = slotEnd;
        }
      });
    }

    // Sort slots just in case
    availableSlots.sort();

    return NextResponse.json({ success: true, slots: availableSlots });
  } catch (error: any) {
    console.error('Fetch slots error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
