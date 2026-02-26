import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, rateLimitHeaders } from '@nzila/os-core/rateLimit'

/**
 * CFO Edge Middleware — Three-layer protection aligned with console reference.
 *
 * Layer 1: Rate limiting (skip in dev — HMR triggers too many requests)
 * Layer 2: Clerk authentication (skip in dev — prevents handshake loops)
 * Layer 3: Request-ID propagation (x-request-id header)
 */

const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/platform(.*)',
  '/pricing(.*)',
  '/contact(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health(.*)',
  '/api/webhooks(.*)',
])

const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? '120')
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? '60000')

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // ── Rate limiting (skip in dev — HMR triggers too many requests) ──────
  if (process.env.NODE_ENV !== 'development') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
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

  // ── Authentication (skip in dev — prevents Clerk handshake loops) ────
  if (process.env.NODE_ENV !== 'development' && !isPublicRoute(request)) {
    await auth.protect()
  }

  // ── Request-ID propagation ────────────────────────────────────────────
  const response = NextResponse.next()
  const requestId =
    request.headers.get('x-request-id') ?? crypto.randomUUID()
  response.headers.set('x-request-id', requestId)
  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
