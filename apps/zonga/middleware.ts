/**
 * Edge Middleware — Three-layer protection for Zonga.
 * Layer 1: Clerk authentication (skip for public + auth routes)
 * Layer 2: next-intl locale routing
 * Layer 3: Request-ID propagation (x-request-id header)
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/lib/locales';

/* ── Route matchers ── */
const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/pricing(.*)',
  '/contact(.*)',
  '/artists(.*)',
  '/for-labels(.*)',
]);

const isMarketingPath = (pathname: string) =>
  ['/', '/about', '/pricing', '/contact', '/artists', '/for-labels'].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

const isClerkAuthPath = (pathname: string) =>
  pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

/* ── Intl middleware ── */
const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

/* ── Main middleware ── */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  /* Skip locale redirect for pure marketing & auth pages */
  if (isMarketingPath(request.nextUrl.pathname) || isClerkAuthPath(request.nextUrl.pathname)) {
    const response = NextResponse.next();
    response.headers.set('x-request-id', crypto.randomUUID());
    return response;
  }

  /* Protect non-public routes */
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  /* Apply i18n routing for dashboard and other locale paths */
  const response = intlMiddleware(request);
  response.headers.set('x-request-id', crypto.randomUUID());
  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
