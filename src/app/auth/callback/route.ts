import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

function getRoleHome(role?: string | null) {
  if (role === 'mentor') return '/mentors/dashboard';
  if (role === 'organization' || role === 'campus_admin') return '/organization/dashboard';
  return '/dashboard';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/dashboard';

  if (next === '/') next = '/dashboard';

  if (code) {
    const supabase = await createSupabaseServer();
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
    }

    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, college, branch')
        .eq('id', session.user.id)
        .maybeSingle();

      const role = profile?.role || session.user.user_metadata?.role || 'student';

      if (role === 'organization' || role === 'campus_admin') {
        return NextResponse.redirect(`${origin}/organization/dashboard`);
      }

      if (!profile?.college || !profile?.branch) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      const fallback = getRoleHome(role);
      const path = next.startsWith('/') ? next : fallback;
      return NextResponse.redirect(`${origin}${path}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth-failed`);
}
