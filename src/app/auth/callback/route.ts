import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // 'next' can be used for deep-linking, default to /dashboard
  let next = searchParams.get('next') ?? '/dashboard';
  
  // If next is just '/', force it to '/dashboard' for a better post-login experience
  if (next === '/') next = '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    );
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/$/, '');
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);
    if (session) {
      // Check if profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('college')
        .eq('id', session.user.id)
        .single();
      
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/$/, '');
      
      if (!profile || !profile.college) {
        return NextResponse.redirect(`${appUrl}/auth/onboarding`);
      }

      const path = next.startsWith('/') ? next : '/dashboard';
      return NextResponse.redirect(`${appUrl}${path}`);
    }
  }

  // Error case — send back to auth page with error param
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/$/, '');
  return NextResponse.redirect(`${appUrl}/auth?error=auth-failed`);
}
