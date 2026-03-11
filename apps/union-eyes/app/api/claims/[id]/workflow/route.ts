/**
 * GET /api/claims/[id]/workflow
 * Returns the current workflow state for a claim
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { claims } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAllowedClaimTransitions } from '@/lib/services/claim-workflow-fsm';
import type { ClaimStatus } from '@/lib/services/claim-workflow-fsm';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const claim = await db.query.claims.findFirst({ where: eq(claims.claimId, id) });
  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }
  const transitions = getAllowedClaimTransitions(claim.status as ClaimStatus);
  return NextResponse.json({ status: claim.status, availableTransitions: transitions });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { djangoProxy } = await import('@/lib/django-proxy');
  return djangoProxy(req, '/api/grievances/claims/' + id + '/workflow/', { method: 'POST' });
}