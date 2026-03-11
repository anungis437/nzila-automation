/**
 * GET /api/claims
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { listClaims } from '@/lib/services/claims-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const priority = url.searchParams.get('priority') || undefined;
  const claimType = url.searchParams.get('claimType') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  const result = await listClaims(
    { organizationId, status, priority, claimType, search },
    { page, limit }
  );
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/grievances/claims/', { method: 'POST' });
}