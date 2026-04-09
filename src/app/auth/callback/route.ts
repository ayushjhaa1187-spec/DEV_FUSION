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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Always redirect to dashboard (or deep-link target) after successful OAuth
      const redirectTo = next.startsWith('/') ? `${origin}${next}` : `${origin}/dashboard`;
      return NextResponse.redirect(redirectTo);
    }
  }

  // Error case — send back to auth page with error param
  return NextResponse.redirect(`${origin}/auth?error=auth-failed`);
}
