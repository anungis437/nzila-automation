/**
 * GET /api/bargaining/proposals/[id]
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProposalById } from '@/lib/services/negotiations-service';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const proposal = await getProposalById(id);
  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }
  return NextResponse.json(proposal);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/bargaining/bargaining-proposals/' + id + '/', { method: 'PATCH' });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/bargaining/bargaining-proposals/' + id + '/', { method: 'DELETE' });
}

