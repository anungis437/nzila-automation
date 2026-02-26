/**
 * NACP Exams — Edge Middleware
 *
 * 4-layer stack (aligned with console reference + i18n):
 *   Layer 1: Edge  — Rate limiting (skip in dev)
 *   Layer 2: Edge  — Clerk auth (skip in dev)
 *   Layer 3: Edge  — i18n routing (next-intl)
 *   Layer 4: Edge  — Request-ID propagation
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { checkRateLimit, rateLimitHeaders } from '@nzila/os-core/rateLimit'
import { locales, defaultLocale } from './lib/locales'

// ── Request-ID propagation (Edge-safe) ──────────────────────────────────────

function ensureRequestId(req: NextRequest): string {
  return req.headers.get('x-request-id') ?? crypto.randomUUID()
}

function withRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set('x-request-id', requestId)
  return response
}

// ── Route matchers ──────────────────────────────────────────────────────────

const isPublicRoute = createRouteMatcher([
  "/",
  "/:locale",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
  "/about(.*)",
  "/pricing(.*)",
  "/contact(.*)",
  "/demo-request(.*)",
  "/api/health(.*)",
]);

const isClerkAuthPath = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isMarketingPath = createRouteMatcher([
  "/",
  "/about(.*)",
  "/pricing(.*)",
  "/contact(.*)",
  "/demo-request(.*)",
]);

// ── i18n middleware ─────────────────────────────────────────────────────────

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
})

// ── Rate limiting ───────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? '120')
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? '60000')

// ── Main middleware ─────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, req) => {
  const requestId = ensureRequestId(req)

  // ── Rate limiting (skip in dev — HMR triggers too many requests) ──────
  if (process.env.NODE_ENV !== 'development') {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'
    const rl = checkRateLimit(ip, {
      max: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        {
          status: 429,
          headers: rateLimitHeaders(rl, RATE_LIMIT_MAX),
        },
      )
    }
  }

  // API routes — protect unless explicitly public
  if (req.nextUrl.pathname.startsWith('/api')) {
    if (!isPublicRoute(req)) {
      await auth.protect()
    }
    return withRequestId(NextResponse.next(), requestId)
  }

  // Static files
  if (req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.includes('.')) {
    return withRequestId(NextResponse.next(), requestId);
  }

  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Skip intl for Clerk auth paths (prevent redirect loops)
  if (isClerkAuthPath(req)) {
    return withRequestId(NextResponse.next(), requestId);
  }

  // Skip intl for marketing pages (root paths, no locale prefix)
  if (isMarketingPath(req)) {
    return withRequestId(NextResponse.next(), requestId);
  }

  // Run i18n middleware for locale-prefixed routes
  const intlResponse = intlMiddleware(req);
  if (intlResponse instanceof NextResponse) {
    return withRequestId(intlResponse, requestId);
  }
  const nr = NextResponse.next({ headers: new Headers((intlResponse as Response).headers) });
  nr.headers.set('x-request-id', requestId);
  return nr;
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\..*).*)' 
  ],
};
