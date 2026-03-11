/**
 * GET /api/bargaining/negotiations/[id]
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getNegotiationById } from '@/lib/services/negotiations-service';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const negotiation = await getNegotiationById(id);
  if (!negotiation) {
    return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
  }
  return NextResponse.json(negotiation);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/bargaining/negotiations/' + id + '/', { method: 'PATCH' });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/bargaining/negotiations/' + id + '/', { method: 'DELETE' });
}

