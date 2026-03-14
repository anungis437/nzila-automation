import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/db';
import { organizationMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withRLSContext } from '@/lib/db/with-rls-context';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const rows = await db.select().from(organizationMembers)
    .where(eq(organizationMembers.organizationId, id));

  const mapped = rows.map(row => ({
    id: row.id,
    user_id: row.userId,
    organization_id: row.organizationId,
    role: row.role,
    status: row.status,
    name: row.name,
    email: row.email,
    phone: row.phone,
    department: row.department,
    membership_number: row.membershipNumber,
    is_primary: row.isPrimary,
    created_at: row.createdAt,
    joined_at: row.joinedAt,
    updated_at: row.updatedAt,
  }));

  return NextResponse.json({ data: mapped });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [created] = await withRLSContext(async () =>
    db.insert(organizationMembers).values({
      userId: body.user_id,
      organizationId: id,
      role: body.role ?? 'member',
      status: body.status ?? 'active',
      name: body.name,
      email: body.email,
      phone: body.phone,
      department: body.department,
      membershipNumber: body.membership_number,
    }).returning()
  );

  return NextResponse.json({ data: created }, { status: 201 });
}