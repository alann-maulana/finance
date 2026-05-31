import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'finance_auth';
const VENDOR_COOKIE = 'finance_vendor';
const VERIFIED_COOKIE = 'finance_verified';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = request.cookies.has(AUTH_COOKIE);
  const hasVendor = request.cookies.has(VENDOR_COOKIE);
  const isVerified = request.cookies.get(VERIFIED_COOKIE)?.value === 'true';

  // ── Root path: redirect to appropriate location ──
  if (pathname === '/') {
    if (isAuthenticated && hasVendor) {
      return NextResponse.redirect(
        new URL(isVerified ? '/dashboard' : '/not-verified', request.url)
      );
    }
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/connect-vendor', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── /login: already authenticated → skip ahead ──
  if (pathname === '/login') {
    if (isAuthenticated && hasVendor) {
      return NextResponse.redirect(
        new URL(isVerified ? '/dashboard' : '/not-verified', request.url)
      );
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
      return NextResponse.redirect(
        new URL(isVerified ? '/dashboard' : '/not-verified', request.url)
      );
    }
    return NextResponse.next();
  }

  // ── /not-verified: needs auth + vendor, redirect to dashboard if verified ──
  if (pathname === '/not-verified') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!hasVendor) {
      return NextResponse.redirect(new URL('/connect-vendor', request.url));
    }
    if (isVerified) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ── All other routes: need auth + vendor + verified ──
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!hasVendor) {
    return NextResponse.redirect(new URL('/connect-vendor', request.url));
  }
  if (!isVerified) {
    return NextResponse.redirect(new URL('/not-verified', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets and PWA files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
