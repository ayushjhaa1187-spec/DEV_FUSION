// src/app/api/organization/analytics/engagement/route.ts

import { createSupabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    // 1. Get the organization associated with the current user
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!org) return new NextResponse('Organization not found', { status: 404 });

    // 2. Call the optimized RPC function for aggregate engagement
    const { data: engagement, error } = await supabase.rpc('get_org_engagement', {
      p_org_id: org.id,
      p_days: days
    });

    if (error) throw error;

    // 3. Format data for charts (Pie/Bar)
    const formattedData = engagement.map((item: any) => ({
      name: item.action.replace(/_/g, ' ').toUpperCase(),
      value: parseInt(item.activity_count),
    }));

    return NextResponse.json(formattedData);

  } catch (err: any) {
    console.error('[org_engagement_api] Error:', err);
    return new NextResponse(err.message || 'Internal Server Error', { status: 500 });
  }
}
