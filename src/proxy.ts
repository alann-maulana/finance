import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'finance_auth';
const VENDOR_COOKIE = 'finance_vendor';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = request.cookies.has(AUTH_COOKIE);
  const hasVendor = request.cookies.has(VENDOR_COOKIE);

  // ── Root path: redirect to appropriate location ──
  if (pathname === '/') {
    if (isAuthenticated && hasVendor) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/connect-vendor', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── /login: already authenticated → skip ahead ──
  if (pathname === '/login') {
    if (isAuthenticated && hasVendor) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/connect-vendor', request.url));
    }
    return NextResponse.next();
  }

  // ── /connect-vendor: needs auth, skip if already has vendor ──
  if (pathname === '/connect-vendor') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (hasVendor) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ── All other routes: need both auth + vendor ──
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!hasVendor) {
    return NextResponse.redirect(new URL('/connect-vendor', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
