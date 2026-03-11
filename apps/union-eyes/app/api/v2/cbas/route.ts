/**
 * GET POST /api/v2/cbas
 * Drizzle ORM — direct database access
 */
import { withApi } from '@/lib/api/framework';
import { listCBAs, createCBA, type CBAFilters } from '@/lib/services/cba-service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Cbas'],
      summary: 'List collective agreements',
      description: 'List CBAs with filtering, search, and pagination via Drizzle ORM.',
    },
  },
  async ({ request }) => {
    const url = new URL(request.url);
    const filters: CBAFilters = {};

    const orgId = url.searchParams.get('organizationId');
    if (orgId) filters.organizationId = orgId;

    const status = url.searchParams.getAll('status');
    if (status.length) filters.status = status;

    const jurisdiction = url.searchParams.getAll('jurisdiction');
    if (jurisdiction.length) filters.jurisdiction = jurisdiction;

    const sector = url.searchParams.get('sector');
    if (sector) filters.sector = sector;

    const employer = url.searchParams.get('employerName');
    if (employer) filters.employerName = employer;

    const union = url.searchParams.get('unionName');
    if (union) filters.unionName = union;

    const search = url.searchParams.get('search');
    if (search) filters.searchQuery = search;

    const isPublic = url.searchParams.get('isPublic');
    if (isPublic !== null) filters.isPublic = isPublic === 'true';

    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const sortBy = url.searchParams.get('sortBy') || 'effectiveDate';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const result = await listCBAs(filters, { page, limit, sortBy, sortOrder });
    return NextResponse.json(result);
  },
);

export const POST = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Cbas'],
      summary: 'Create collective agreement',
      description: 'Create a new CBA via Drizzle ORM.',
    },
  },
  async ({ request }) => {
    const body = await request.json();
    const cba = await createCBA(body);
    return NextResponse.json(cba, { status: 201 });
  },
);
