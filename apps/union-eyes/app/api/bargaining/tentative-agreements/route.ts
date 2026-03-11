/**
 * GET /api/bargaining/tentative-agreements
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { listTentativeAgreements } from '@/lib/services/negotiations-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const negotiationId = url.searchParams.get('negotiationId') || undefined;
  const result = await listTentativeAgreements(negotiationId);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/bargaining/tentative-agreements/', { method: 'POST' });
}

