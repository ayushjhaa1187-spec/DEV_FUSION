import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get the target user ID from username
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'Target profile not found' }, { status: 404 });
    }

    if (targetProfile.id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // 2. Insert follow record
    const { error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUser.id,
        following_id: targetProfile.id
      });

    if (followError) {
      if (followError.code === '23505') {
        return NextResponse.json({ message: 'Already following' });
      }
      throw followError;
    }

    return NextResponse.json({ message: 'Followed successfully' });
  } catch (error: any) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get the target user ID from username
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'Target profile not found' }, { status: 404 });
    }

    // 2. Delete follow record
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('following_id', targetProfile.id);

    if (unfollowError) throw unfollowError;

    return NextResponse.json({ message: 'Unfollowed successfully' });
  } catch (error: any) {
    console.error('Unfollow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
