import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/manage', '/admin'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Admin login page must be reachable without a session.
  if (pathname === '/admin/login') return NextResponse.next();
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const hasSession = req.cookies.has('access_token') || req.cookies.has('refresh_token');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    if (pathname.startsWith('/admin')) {
      url.pathname = '/admin/login';
    } else {
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/manage/:path*', '/admin/:path*'],
};
