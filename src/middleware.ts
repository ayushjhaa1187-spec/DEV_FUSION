import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const publicPaths = ['/auth', '/', '/api/auth'];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // If there's no token and the path is not public, redirect to /auth
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // If there's a token and the user tries to access /auth, redirect to /dashboard
  if (token && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
