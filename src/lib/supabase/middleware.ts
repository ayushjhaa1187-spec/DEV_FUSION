import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected routes
  const protectedRoutes = [
    '/dashboard', '/profile', '/settings', 
    '/doubts', '/mentors', '/tests', 
    '/leaderboard', '/billing', '/certificates', '/admin'
  ]
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to home if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('message', 'Please sign in to access this page')
    return NextResponse.redirect(url)
  }

  // Redirect to onboarding if authenticated but role is missing
  if (user && isProtectedRoute && !request.nextUrl.pathname.startsWith('/onboarding')) {
    // 1. Check metadata first (Zero-cost)
    const metadataRole = user.user_metadata?.role;
    
    if (!metadataRole) {
      // 2. Only query DB if metadata is missing (minimizes 429 chance)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
        
      if (!profile?.role) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        // Avoid infinite loop if we somehow got stuck
        if (request.nextUrl.pathname === '/onboarding') return supabaseResponse;
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
