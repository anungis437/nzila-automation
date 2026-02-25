/**
 * NACP Exams — Edge Middleware
 *
 * 3-layer stack (aligned with Union Eyes):
 *   Layer 1: Edge  — Clerk auth + i18n routing (this file)
 *   Layer 2: DB    — RLS context injection (future)
 *   Layer 3: App   — RBAC authorization (future)
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/locales';

// ── Request-ID propagation (Edge-safe) ──────────────────────────────────────

function ensureRequestId(req: NextRequest): string {
  return req.headers.get('x-request-id') ?? crypto.randomUUID();
}

function withRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set('x-request-id', requestId);
  return response;
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
});

// ── Main middleware ─────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, req) => {
  const requestId = ensureRequestId(req);

  // API routes — protect unless explicitly public
  if (req.nextUrl.pathname.startsWith('/api')) {
    await auth.protect();
    return withRequestId(NextResponse.next(), requestId);
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
