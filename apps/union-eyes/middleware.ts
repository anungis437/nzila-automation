// @ts-nocheck
/**
 * Next.js Edge Middleware
 * 
 * MIDDLEWARE STACK ARCHITECTURE:
 * ================================
 * 
 * This application uses a multi-layer middleware approach for security and isolation:
 * 
 * Layer 1: Edge Middleware (THIS FILE)
 * - Runs on Vercel Edge/Cloudflare network before request reaches application
 * - Responsibilities:
 *   1. Clerk authentication (JWT validation, session management)
 *   2. i18n localization routing
 *   3. Route protection (public vs protected routes)
 *   4. Webhook authentication (cron, Stripe, Clerk webhooks)
 * - Sets: userId, orgId, sessionClaims in request context
 * 
 * Layer 2: Database RLS Context (lib/db/with-rls-context.ts)
 * - Runs inside API routes and server actions
 * - Responsibilities:
 *   1. Sets PostgreSQL session variables (app.current_user_id)
 *   2. Enables Row-Level Security enforcement
 *   3. Transaction-scoped isolation (prevents context leakage)
 * - Usage: Wrap all database operations in withRLSContext()
 * 
 * Layer 3: Application Authorization (lib/auth.ts)
 * - Runs inside business logic
 * - Responsibilities:
 *   1. Role-based access control (RBAC)
 *   2. Organization membership checks
 *   3. Permission validation
 * - Functions: hasRole(), isSystemAdmin(), hasRoleInOrganization()
 * 
 * COORDINATION:
 * - Edge middleware authenticates user via Clerk
 * - RLS middleware sets database context using authenticated user ID
 * - RLS policies enforce row-level security automatically
 * - Application code can add additional authorization checks as needed
 * 
 * See: docs/security/RLS_AUTH_RBAC_ALIGNMENT.md for complete architecture
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/locales';
import { PUBLIC_API_ROUTES, CRON_API_ROUTES, isPublicRoute as isPublicApiRoute } from './lib/public-routes';

const isProtectedRoute = createRouteMatcher([
  "/:locale/dashboard(.*)"
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/:locale",
  "/login(.*)",
  "/signup(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/:locale/login(.*)",
  "/:locale/signup(.*)",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)"
]);

// Clerk's auth pages live at root (no locale prefix) — skip intl redirect for them
const isClerkAuthPath = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/signup(.*)",
]);

// PR #4: Removed duplicate API route lists (now imported from lib/api-auth-guard.ts)
// This ensures single source of truth for route allowlists

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true
});

// =============================================================================
// CORS ORIGIN WHITELIST (Security Hardened - Feb 2026)
// =============================================================================
// Allowed origins for CORS requests. Never falls back to wildcard in production.
// Multiple origins can be specified as comma-separated list.
const getAllowedOrigins = (): string[] => {
  const originsEnv = process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '';
  
  // Development: Allow localhost
  if (process.env.NODE_ENV === 'development') {
    const devOrigins = ['http://localhost:3000', 'http://localhost:3001'];
    return originsEnv ? [...devOrigins, ...originsEnv.split(',').map(o => o.trim())] : devOrigins;
  }
  
  // Production: Require explicit configuration, fail secure
  if (!originsEnv) {
    console.warn('⚠️  CORS_ALLOWED_ORIGINS not configured - CORS disabled for security');
    return [];
  }
  
  return originsEnv.split(',').map(o => o.trim()).filter(Boolean);
};

const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
};

// This handles both payment provider use cases from whop-setup.md and stripe-setup.md
export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith('/api')) {
    // PR #4: Use centralized public route checker from api-auth-guard.ts
    if (isPublicApiRoute(req.nextUrl.pathname)) {
      const origin = req.headers.get('origin');
      
      // Handle CORS preflight for public API routes
      if (req.method === 'OPTIONS') {
        // Security: Only allow configured origins
        if (origin && isOriginAllowed(origin)) {
          return new NextResponse(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
              'Access-Control-Max-Age': '86400',
              'Vary': 'Origin',
            },
          });
        }
        // Reject disallowed origins
        return new NextResponse(null, { status: 403 });
      }

      const response = NextResponse.next();
      // Security: Only set CORS headers for allowed origins
      if (origin && isOriginAllowed(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Vary', 'Origin');
      }
      return response;
    }

    // PR #4: Check cron routes using centralized CRON_API_ROUTES
    if (CRON_API_ROUTES.has(req.nextUrl.pathname)) {
      const cronSecret = process.env.CRON_SECRET || "";
      const providedSecret = req.headers.get("x-cron-secret") || "";
      if (!cronSecret || cronSecret !== providedSecret) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      return NextResponse.next();
    }

    await auth.protect();
    return NextResponse.next();
  }

  // Skip middleware for static files
  if (req.nextUrl.pathname.startsWith('/_next') ||
      req.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Check for problematic URLs that might cause 431 errors
  // This covers payment provider redirects ONLY.
  // NOTE: __clerk_handshake must NOT be stripped — Clerk uses it to refresh
  // short-lived session JWTs. Stripping it breaks session refresh and forces
  // authenticated users back to the sign-in page.
  if (
    req.nextUrl.search && (
      req.nextUrl.search.includes('payment_intent') ||
      req.nextUrl.search.includes('checkout_id') ||
      req.nextUrl.search.includes('ref=') ||
      req.nextUrl.search.includes('client_reference_id=')
    )
  ) {
    // The URL contains parameters that might cause 431 errors
    // Instead of just letting it pass through, redirect to a clean URL
    // This prevents the accumulation of large cookies
    
    // Extract the base URL path without query parameters
    const cleanUrl = req.nextUrl.pathname;
    
    // Create a new URL object based on the current request
    const url = new URL(cleanUrl, req.url);
    
    // Important: Add a small cache-busting parameter to ensure the browser doesn't use cached data
    // This helps avoid cookie-related issues without adding significant query string size
    url.searchParams.set('cb', Date.now().toString().slice(-4));
    
    // Return a redirect response to the clean URL
    return NextResponse.redirect(url);
  }

  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  
  // Clerk auth paths (/sign-in, /sign-up, etc.) must NOT be locale-redirected.
  // Clerk's NEXT_PUBLIC_CLERK_SIGN_IN_URL is configured without locale prefix,
  // so adding it would create a redirect loop (Clerk → /sign-in → intl → /en-CA/sign-in → Clerk → ...).
  if (isClerkAuthPath(req)) {
    return NextResponse.next();
  }

  // For non-API routes, run i18n middleware and return its response
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, but match everything else
    '/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\..*).*)' 
  ]
};
