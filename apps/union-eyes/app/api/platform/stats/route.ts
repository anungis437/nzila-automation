/**
 * Platform Stats API
 * 
 * Returns real-time platform metrics from the database for the Nzila Ops Dashboard,
 * Customer Success, and other platform admin pages.
 * 
 * @route GET /api/platform/stats
 * @auth Required — minimum role: platform_lead
 */

import { db } from '@/db/db';
import { organizations, organizationMembers } from '@/db/schema';
import { sql, ne, count, sum } from 'drizzle-orm';
import { withApi } from '@/lib/api/framework';

export const dynamic = 'force-dynamic';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'platform_lead' },
    openapi: {
      tags: ['Platform', 'Admin'],
      summary: 'Platform-wide statistics from real database',
    },
  },
  async () => {
    // ── Organization stats ──
    const orgStats = await db
      .select({
        totalOrganizations: count(),
        totalMemberCount: sum(organizations.memberCount),
        totalActiveMemberCount: sum(organizations.activeMemberCount),
        activeOrganizations: sql<number>`count(*) filter (where ${organizations.status} = 'active')`,
        unionCount: sql<number>`count(*) filter (where ${organizations.organizationType} = 'union')`,
        congressCount: sql<number>`count(*) filter (where ${organizations.organizationType} = 'congress')`,
        federationCount: sql<number>`count(*) filter (where ${organizations.organizationType} = 'federation')`,
        clcAffiliatedCount: sql<number>`count(*) filter (where ${organizations.clcAffiliated} = true)`,
      })
      .from(organizations)
      .where(ne(organizations.organizationType, 'platform'));

    // ── Registered users (organization_members) ──
    const memberStats = await db
      .select({
        totalRegisteredUsers: count(),
        activeUsers: sql<number>`count(*) filter (where ${organizationMembers.status} = 'active')`,
        distinctOrgs: sql<number>`count(distinct ${organizationMembers.organizationId})`,
      })
      .from(organizationMembers);

    // ── Grievance stats ──
    const grievanceStats = await db.execute(sql`
      SELECT 
        count(*) as total_grievances,
        count(*) filter (where status NOT IN ('settled', 'withdrawn', 'dismissed')) as open_grievances,
        count(*) filter (where priority IN ('high', 'urgent')) as high_priority,
        count(*) filter (where status = 'settled') as resolved_grievances,
        count(*) filter (where status = 'arbitration') as in_arbitration
      FROM grievances
    `);

    // ── Collective agreement stats ──
    const cbaStats = await db.execute(sql`
      SELECT 
        count(*) as total_cbas,
        count(*) filter (where status = 'active') as active_cbas,
        count(*) filter (where status = 'under_negotiation') as negotiating_cbas,
        count(*) filter (where status = 'expired') as expired_cbas
      FROM collective_agreements
    `);

    // ── Settlement stats ──
    const settlementStats = await db.execute(sql`
      SELECT 
        count(*) as total_settlements,
        coalesce(sum(monetary_amount), 0) as total_monetary_value
      FROM settlements
    `);

    // ── Sector breakdown ──
    const sectorBreakdown = await db.execute(sql`
      SELECT 
        unnest(sectors) as sector,
        count(*) as org_count,
        sum(member_count) as total_members
      FROM organizations 
      WHERE organization_type != 'platform' AND array_length(sectors, 1) > 0
      GROUP BY unnest(sectors)
      ORDER BY total_members DESC
    `);

    // ── Organization list with health data ──
    const orgList = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        organizationType: organizations.organizationType,
        status: organizations.status,
        memberCount: organizations.memberCount,
        activeMemberCount: organizations.activeMemberCount,
        sectors: organizations.sectors,
        clcAffiliated: organizations.clcAffiliated,
        subscriptionTier: organizations.subscriptionTier,
        perCapitaRate: organizations.perCapitaRate,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(ne(organizations.organizationType, 'platform'));

    // ── Member role distribution ──
    const roleDistribution = await db.execute(sql`
      SELECT role, count(*) as cnt 
      FROM organization_members 
      GROUP BY role 
      ORDER BY cnt DESC
    `);

    const org = orgStats[0];
    const members = memberStats[0];
    const grievances = grievanceStats[0] ?? {};
    const cbas = cbaStats[0] ?? {};
    const settlements = settlementStats[0] ?? {};
    const sectors = Array.from(sectorBreakdown);
    const roles = Array.from(roleDistribution);

    return {
      // Top-level KPIs
      totalOrganizations: Number(org?.totalOrganizations ?? 0),
      activeOrganizations: Number(org?.activeOrganizations ?? 0),
      totalMemberCount: Number(org?.totalMemberCount ?? 0),
      totalActiveMemberCount: Number(org?.totalActiveMemberCount ?? 0),
      registeredUsers: Number(members?.totalRegisteredUsers ?? 0),
      activeUsers: Number(members?.activeUsers ?? 0),
      
      // Organization breakdown
      organizationTypes: {
        unions: Number(org?.unionCount ?? 0),
        congresses: Number(org?.congressCount ?? 0),
        federations: Number(org?.federationCount ?? 0),
      },
      clcAffiliatedCount: Number(org?.clcAffiliatedCount ?? 0),

      // Grievances
      grievances: {
        total: Number(grievances.total_grievances ?? 0),
        open: Number(grievances.open_grievances ?? 0),
        highPriority: Number(grievances.high_priority ?? 0),
        resolved: Number(grievances.resolved_grievances ?? 0),
        inArbitration: Number(grievances.in_arbitration ?? 0),
      },

      // Collective Agreements
      collectiveAgreements: {
        total: Number(cbas.total_cbas ?? 0),
        active: Number(cbas.active_cbas ?? 0),
        negotiating: Number(cbas.negotiating_cbas ?? 0),
        expired: Number(cbas.expired_cbas ?? 0),
      },

      // Settlements
      settlements: {
        total: Number(settlements.total_settlements ?? 0),
        totalMonetaryValue: Number(settlements.total_monetary_value ?? 0),
      },

      // Sector breakdown
      sectors,

      // Organization list (for Customer Success widgets)
      organizations: orgList,

      // Role distribution
      roleDistribution: roles,
    };
  },
);
