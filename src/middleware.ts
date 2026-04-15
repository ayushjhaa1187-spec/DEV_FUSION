import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/doubts/new',
  '/doubts/ask',
  '/mentors/book',
  '/sessions',
  '/tests',
  '/admin',
  '/onboarding',
  '/ai-tools',
  '/organization/dashboard',
  '/billing',
];

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/signup', '/auth'];

// Basic in-memory rate limiting (Note: This is instance-local, but works as a fast/free baseline)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_THRESHOLD = 50; // 50 requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export async function middleware(request: NextRequest) {
  const ip = request.ip || '127.0.0.1';
  const path = request.nextUrl.pathname;

  // 1. Basic Rate Limiting for API routes
  if (path.startsWith('/api') && !path.startsWith('/api/public')) {
    const now = Date.now();
    const limitInfo = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - limitInfo.lastReset > RATE_LIMIT_WINDOW) {
      limitInfo.count = 1;
      limitInfo.lastReset = now;
    } else {
      limitInfo.count++;
    }

    rateLimitMap.set(ip, limitInfo);

    if (limitInfo.count > RATE_LIMIT_THRESHOLD) {
      return new NextResponse('Neural network congestion. Please wait.', { 
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // getUser() is more secure as it revalidates with Supabase Auth
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    console.error('Middleware auth check failed:', e);
  }

  const isProtected = PROTECTED_ROUTES.some((route) => path.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));

  if (isProtected) {
    if (!user) {
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect authenticated users away from auth pages, EXCEPT for the callback route
  if (isAuthRoute && user && !path.includes('/auth/callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api/public).*)'],
};
