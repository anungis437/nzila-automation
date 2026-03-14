import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { organizations } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/organizations — query organizations from DB */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parentId = searchParams.get('parent');
  const statusFilter = searchParams.get('status');

  const conditions = [];
  if (parentId) conditions.push(eq(organizations.parentId, parentId));
  if (statusFilter) conditions.push(eq(organizations.status, statusFilter));

  const where = conditions.length > 0
    ? sql`${sql.join(conditions, sql` AND `)}`
    : undefined;

  const rows = await db.select().from(organizations).where(where);

  // Map camelCase DB fields to snake_case expected by frontend
  const mapped = rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    display_name: row.displayName,
    short_name: row.shortName,
    organization_type: row.organizationType,
    parent_id: row.parentId,
    hierarchy_path: row.hierarchyPath,
    hierarchy_level: row.hierarchyLevel,
    province_territory: row.provinceTerritory,
    sectors: row.sectors,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address: row.address,
    clc_affiliated: row.clcAffiliated,
    affiliation_date: row.affiliationDate,
    charter_number: row.charterNumber,
    member_count: row.memberCount,
    active_member_count: row.activeMemberCount,
    last_member_count_update: row.lastMemberCountUpdate,
    subscription_tier: row.subscriptionTier,
    billing_contact_id: row.billingContactId,
    settings: row.settings ?? {},
    features_enabled: row.featuresEnabled ?? [],
    status: row.status,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    created_by: row.createdBy,
    legacy_org_id: row.legacyOrgId,
  }));

  return NextResponse.json({ data: mapped });
}

/** POST /api/organizations — create organization in DB */
export async function POST(req: NextRequest) {
  const body = await req.json();

  const [created] = await db.insert(organizations).values({
    name: body.name,
    slug: body.slug,
    displayName: body.display_name,
    organizationType: body.organization_type ?? 'union',
    parentId: body.parent_id,
    hierarchyPath: body.hierarchy_path ?? [],
    hierarchyLevel: body.hierarchy_level ?? 0,
    sectors: body.sectors ?? [],
    email: body.email,
    phone: body.phone,
    website: body.website,
    status: body.status ?? 'active',
    clcAffiliated: body.clc_affiliated ?? false,
    memberCount: body.member_count ?? 0,
    activeMemberCount: body.active_member_count ?? 0,
    settings: body.settings ?? {},
    featuresEnabled: body.features_enabled ?? [],
  }).returning();

  return NextResponse.json({ data: created }, { status: 201 });
}