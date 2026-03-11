/**
 * GET /api/bargaining/negotiations
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { listNegotiations } from '@/lib/services/negotiations-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const orgId = url.searchParams.get('organizationId') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  const result = await listNegotiations({ organizationId: orgId, status, search }, { page, limit });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  // Retain Django proxy for write operations until fully migrated
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/bargaining/negotiations/', { method: 'POST' });
}

