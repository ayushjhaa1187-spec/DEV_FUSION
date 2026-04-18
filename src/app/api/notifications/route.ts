import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limitStr = searchParams.get('limit') || '50';
        const limit = parseInt(limitStr);

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('Error fetching notifications:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { notification_id, mark_all } = body;

        let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);

        if (!mark_all && notification_id) {
            query = query.eq('id', notification_id);
        }

        const { error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error updating notification(s):', err);
        return NextResponse.json({ success: false, error: 'Failed to update notification(s)' }, { status: 500 });
    }
}
