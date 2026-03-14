import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { organizations } from '@/db/schema-organizations';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET /api/organizations/:id/descendants — orgs whose hierarchy_path contains this id */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const rows = await db.select().from(organizations)
    .where(sql`${id} = ANY(${organizations.hierarchyPath}) AND ${organizations.id} != ${id}`);

  const mapped = rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    organization_type: row.organizationType,
    parent_id: row.parentId,
    hierarchy_path: row.hierarchyPath,
    hierarchy_level: row.hierarchyLevel,
    member_count: row.memberCount,
    status: row.status,
  }));

  return NextResponse.json({ data: mapped });
}