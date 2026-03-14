/**
 * Platform Stats Queries
 *
 * Shared database queries for platform-wide statistics.
 * Used by both the API route and server components.
 */

import { db } from '@/db/db';
import { organizations, organizationMembers } from '@/db/schema';
import { sql, ne, count, sum } from 'drizzle-orm';

export interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalMemberCount: number;
  totalActiveMemberCount: number;
  registeredUsers: number;
  activeUsers: number;
  organizationTypes: {
    unions: number;
    congresses: number;
    federations: number;
  };
  clcAffiliatedCount: number;
  grievances: {
    total: number;
    open: number;
    highPriority: number;
    resolved: number;
    inArbitration: number;
  };
  collectiveAgreements: {
    total: number;
    active: number;
    negotiating: number;
    expired: number;
  };
  settlements: {
    total: number;
    totalMonetaryValue: number;
  };
  sectors: Array<{ sector: string; org_count: number; total_members: number }>;
  organizations: Array<{
    id: string;
    name: string;
    organizationType: string;
    status: string;
    memberCount: number | null;
    activeMemberCount: number | null;
    sectors: string[];
    clcAffiliated: boolean | null;
    subscriptionTier: string | null;
    perCapitaRate: string | null;
    createdAt: Date;
  }>;
  roleDistribution: Array<{ role: string; cnt: number }>;
}

export async function getPlatformStatsFromDb(): Promise<PlatformStats> {
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
      count(*) filter (where status NOT IN ('settled', 'withdrawn', 'denied', 'closed')) as open_grievances,
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
  const grievanceRow = grievanceStats[0] ?? {};
  const cbaRow = cbaStats[0] ?? {};
  const settlementRow = settlementStats[0] ?? {};
  const sectors = Array.from(sectorBreakdown) as Array<{ sector: string; org_count: number; total_members: number }>;
  const roles = Array.from(roleDistribution) as Array<{ role: string; cnt: number }>;

  return {
    totalOrganizations: Number(org?.totalOrganizations ?? 0),
    activeOrganizations: Number(org?.activeOrganizations ?? 0),
    totalMemberCount: Number(org?.totalMemberCount ?? 0),
    totalActiveMemberCount: Number(org?.totalActiveMemberCount ?? 0),
    registeredUsers: Number(members?.totalRegisteredUsers ?? 0),
    activeUsers: Number(members?.activeUsers ?? 0),
    organizationTypes: {
      unions: Number(org?.unionCount ?? 0),
      congresses: Number(org?.congressCount ?? 0),
      federations: Number(org?.federationCount ?? 0),
    },
    clcAffiliatedCount: Number(org?.clcAffiliatedCount ?? 0),
    grievances: {
      total: Number(grievanceRow.total_grievances ?? 0),
      open: Number(grievanceRow.open_grievances ?? 0),
      highPriority: Number(grievanceRow.high_priority ?? 0),
      resolved: Number(grievanceRow.resolved_grievances ?? 0),
      inArbitration: Number(grievanceRow.in_arbitration ?? 0),
    },
    collectiveAgreements: {
      total: Number(cbaRow.total_cbas ?? 0),
      active: Number(cbaRow.active_cbas ?? 0),
      negotiating: Number(cbaRow.negotiating_cbas ?? 0),
      expired: Number(cbaRow.expired_cbas ?? 0),
    },
    settlements: {
      total: Number(settlementRow.total_settlements ?? 0),
      totalMonetaryValue: Number(settlementRow.total_monetary_value ?? 0),
    },
    sectors,
    organizations: orgList,
    roleDistribution: roles,
  };
}
