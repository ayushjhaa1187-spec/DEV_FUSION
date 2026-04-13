import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if the user is a mentor
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
    if (profile?.role !== 'mentor') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch payouts
    const { data: payouts, error } = await supabase
      .from('mentor_payouts')
      .select('*')
      .eq('mentor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return NextResponse.json({ payouts });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    // Allows mentor to request a withdrawal of pending funds
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    try {
        const { payoutId } = await req.json();

        // Very basic mock logic for requesting withdrawal
        // Real implementation would interface with Razorpay Route or Stripe Connect
        const { data, error } = await supabase
            .from('mentor_payouts')
            .update({ status: 'processing' })
            .eq('id', payoutId)
            .eq('mentor_id', user.id)
            .eq('status', 'pending')
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: 'Failed to process withdrawal request' }, { status: 400 });
        }

        return NextResponse.json({ message: 'Withdrawal processing started', payout: data });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
