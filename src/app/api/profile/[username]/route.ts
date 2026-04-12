import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createSupabaseServer();

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get user's doubts with subject info
    const { data: doubts } = await supabase
      .from('doubts')
      .select('id, title, status, votes, created_at, subjects(name)')
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get user's answers
    const { data: answers } = await supabase
      .from('answers')
      .select('id, content, votes, is_accepted, doubt_id, created_at')
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get follow stats
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id);

    // Check if current user is following this profile
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    let isFollowing = false;
    if (currentUser) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id)
        .single();
      isFollowing = !!followData;
    }

    // Compute reputation stats
    const totalDoubts = doubts?.length || 0;
    const totalAnswers = answers?.length || 0;
    const acceptedAnswers = answers?.filter((a) => a.is_accepted).length || 0;
    const answerVotes = answers?.reduce((sum, a) => sum + (a.votes || 0), 0) || 0;
    const doubtVotes = doubts?.reduce((sum, d) => sum + (d.votes || 0), 0) || 0;
    const reputationScore =
      acceptedAnswers * 15 + answerVotes * 5 + doubtVotes * 2 + totalAnswers * 2;

    // Determine badges
    const badges: string[] = [];
    if (acceptedAnswers >= 1) badges.push('First Answer Accepted');
    if (acceptedAnswers >= 10) badges.push('Problem Solver');
    if (acceptedAnswers >= 50) badges.push('Expert Solver');
    if (totalAnswers >= 100) badges.push('Prolific Answerer');
    if (reputationScore >= 500) badges.push('Rising Star');
    if (reputationScore >= 2000) badges.push('Knowledge Champion');
    if (totalDoubts >= 50) badges.push('Curious Mind');

    // Determine rank
    let rank = 'Beginner';
    if (reputationScore >= 100) rank = 'Learner';
    if (reputationScore >= 500) rank = 'Contributor';
    if (reputationScore >= 1500) rank = 'Expert';
    if (reputationScore >= 5000) rank = 'Master';

    return NextResponse.json({
      profile,
      doubts: doubts || [],
      answers: answers || [],
      stats: {
        totalDoubts,
        totalAnswers,
        acceptedAnswers,
        reputationScore,
        rank,
        badges,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        isFollowing,
      },
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
