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
      const { user } = session;
      
      // 1. Immediate Profile Sync (Ensures profile exists BEFORE redirect)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, college, branch')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[Callback] Profile fetch error:', profileError);
      }

      // 2. If profile is missing or fundamentally empty, redirect to onboarding explicitly
      // Note: We use maybeSingle() so data being null is expected for new users.
      if (!profile) {
        // Upsert a default profile from metadata
        const defaultRole = user.user_metadata?.role || null;
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          role: defaultRole,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' }).catch(e => console.error('[Callback] Upsert failed:', e));
        
        // Always send new users to onboarding to "Choose Their Path" 
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // 3. Role-Aware Redirection
      const role = profile.role || user.user_metadata?.role;

      // Organizations bypass student onboarding
      if (role === 'organization' || role === 'campus_admin') {
        return NextResponse.redirect(`${origin}/organization/dashboard`);
      }

      // Mentors bypass student academic onboarding if they have institution set
      if (role === 'mentor' && profile.college) {
        return NextResponse.redirect(`${origin}/mentors/dashboard`);
      }

      // Students/Mentors without basic info go to onboarding
      if (!profile.college || !profile.branch || !role) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      const fallback = getRoleHome(role);
      const path = next.startsWith('/') ? next : fallback;
      return NextResponse.redirect(`${origin}${path}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth-failed`);
}
