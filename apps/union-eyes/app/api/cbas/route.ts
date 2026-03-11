/**
 * GET POST /api/cbas
 * Drizzle ORM — direct database access (migrated from Django proxy)
 */
import { NextRequest, NextResponse } from 'next/server';
import { listCBAs, createCBA, type CBAFilters } from '@/lib/services/cba-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const filters: CBAFilters = {};

  const orgId = url.searchParams.get('organizationId');
  if (orgId) filters.organizationId = orgId;

  const status = url.searchParams.getAll('status');
  if (status.length) filters.status = status;

  const jurisdiction = url.searchParams.getAll('jurisdiction');
  if (jurisdiction.length) filters.jurisdiction = jurisdiction;

  const search = url.searchParams.get('search');
  if (search) filters.searchQuery = search;

  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  const result = await listCBAs(filters, { page, limit });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cba = await createCBA(body);
  return NextResponse.json(cba, { status: 201 });
}

