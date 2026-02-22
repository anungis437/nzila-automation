/**
 * GET  /api/members/me — enriched member profile (identity + org + claims stats)
 * PATCH /api/members/me — update contact preferences
 *
 * Both proxied to Django; no Drizzle / DB access in this file.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { djangoProxy } from '@/lib/django-proxy';
export const dynamic = 'force-dynamic';

/**
 * GET /api/members/me
 * → Django GET /api/auth_core/profile/
 * Returns: { profile: { userId, email, firstName, lastName, organization,
 *            membershipNumber, role, claimsStats, recentClaims } }
 */
export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/profile/');
}

/**
 * PATCH /api/members/me
 * → Django PATCH /api/auth_core/member-contact-preferences/
 * Body: { timezone?, locale?, phone?, displayName? }
 */
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return djangoProxy(req, '/api/auth_core/member-contact-preferences/', {
    method: 'PATCH',
    extraHeaders: { 'X-Clerk-User-Id': userId },
  });
}
