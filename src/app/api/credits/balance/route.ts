import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('credit_wallets')
    .select('balance, lifetime_purchased, last_topped_up')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true, wallet: data || { balance: 0, lifetime_purchased: 0, last_topped_up: null } });
}
