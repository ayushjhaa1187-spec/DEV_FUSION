import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';


export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // 'next' can be used for deep-linking, default to /dashboard
  let next = searchParams.get('next') ?? '/dashboard';
  
  // If next is just '/', force it to '/dashboard' for a better post-login experience
  if (next === '/') next = '/dashboard';

  if (code) {
    const supabase = await createSupabaseServer();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[Auth Callback] Error:", error.message);
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
    }


    if (session) {
      // Check if profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('college')
        .eq('id', session.user.id)
        .single();
      
      if (!profile || !profile.college) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      const path = next.startsWith('/') ? next : '/dashboard';
      return NextResponse.redirect(`${origin}${path}`);
    }
  }

  // Error case — send back to auth page with error param
  return NextResponse.redirect(`${origin}/auth?error=auth-failed`);
}
