/**
 * GET /api/claims/[id]/updates
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { listClaimUpdates } from '@/lib/services/claims-service';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const updates = await listClaimUpdates(id);
  return NextResponse.json(updates);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/grievances/claims/' + id + '/updates/', { method: 'POST' });
}