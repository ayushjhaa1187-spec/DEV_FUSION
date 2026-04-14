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

export async function middleware(request: NextRequest) {
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

  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (e) {
    console.error('Middleware session fetch failed:', e);
    session = null;
  }

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_ROUTES.some((route) => path.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));

  if (isProtected) {
    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isAuthRoute && session && !path.startsWith('/auth/callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api/public).*)'],
};
