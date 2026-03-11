/**
 * GET /api/claims/[id]
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getClaimById } from '@/lib/services/claims-service';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const claim = await getClaimById(id);
  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }
  return NextResponse.json(claim);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/grievances/claims/' + id + '/', { method: 'PATCH' });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/grievances/claims/' + id + '/', { method: 'DELETE' });
}