import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { organizations } from '@/db/schema-organizations';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function mapOrg(row: typeof organizations.$inferSelect) {
  return {
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
  };
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const [row] = await db.select().from(organizations).where(eq(organizations.id, id));
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: mapOrg(row) });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.display_name !== undefined) updates.displayName = body.display_name;
  if (body.status !== undefined) updates.status = body.status;
  if (body.email !== undefined) updates.email = body.email;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.website !== undefined) updates.website = body.website;
  if (body.sectors !== undefined) updates.sectors = body.sectors;
  if (body.parent_id !== undefined) updates.parentId = body.parent_id;
  if (body.settings !== undefined) updates.settings = body.settings;
  updates.updatedAt = new Date();

  const [updated] = await db.update(organizations).set(updates).where(eq(organizations.id, id)).returning();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: mapOrg(updated) });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const [archived] = await db.update(organizations)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(organizations.id, id))
    .returning();
  if (!archived) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: mapOrg(archived) });
}