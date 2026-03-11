/**
 * GET /api/claims/[id]/workflow/history
 * Returns workflow transition history for a claim
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { grievanceTransitions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const history = await db
    .select()
    .from(grievanceTransitions)
    .where(eq(grievanceTransitions.claimId, id))
    .orderBy(desc(grievanceTransitions.transitionedAt));
  return NextResponse.json(history);
}