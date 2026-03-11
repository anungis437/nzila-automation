/**
 * GET /api/bargaining/proposals
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { listProposals } from '@/lib/services/negotiations-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const negotiationId = url.searchParams.get('negotiationId') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const type = url.searchParams.get('type') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  const result = await listProposals({ negotiationId, status, type }, { page, limit });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/bargaining/bargaining-proposals/', { method: 'POST' });
}

