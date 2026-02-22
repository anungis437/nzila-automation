/**
 * Seed: CLC Organizational Hierarchy
 *
 * Pre-creates the high-level organizations that must exist before any
 * union or local can onboard. Mirrors the real Canadian Labour Congress
 * structure (see: https://canadianlabour.ca):
 *
 *   Level 0 – Canadian Labour Congress (CLC)                   [congress]
 *   Level 1 – 13 Provincial / Territorial Federations          [federation]
 *   Level 1 – 12 National / International Union Affiliates     [union]
 *
 * CLC Hierarchy (real-world):
 *   1. CLC Governance — Convention (highest authority), Officers, Canadian Council
 *   2. Affiliates     — National/international unions (CUPE, Unifor, USW …)
 *   3. Chartered Bodies:
 *      a. Provincial/Territorial Federations of Labour
 *      b. Labour Councils (city/district — mapped to `district` org type)
 *      c. Directly Chartered Locals (local with parentId → CLC)
 *   4. Components & Services — Education, Political Action, Research
 *
 * During onboarding, new unions/locals select their province and the system
 * auto-discovers the matching federation as the suggested parent
 * (via smart-onboarding → autoDetectParentFederation).
 *
 * Idempotent: uses ON CONFLICT (slug) DO NOTHING so it is safe to
 * re-run without duplicating data.
 *
 * Usage:
 *   npx tsx apps/union-eyes/db/seeds/seed-org-hierarchy.ts
 *   — or via the /api/admin/seed-test-data POST endpoint
 */

import { db } from '@/db/db';
import { organizations, organizationRelationships } from '@/db/schema-organizations';

// ──────────────────────────────────────────────────────────────────
// CLC Root
// ──────────────────────────────────────────────────────────────────

const CLC_ORG = {
  name: 'Canadian Labour Congress',
  slug: 'clc',
  displayName: 'CLC',
  shortName: 'CLC',
  description:
    'The Canadian Labour Congress is the national voice of the labour movement, representing 3 million workers.',
  organizationType: 'congress' as const,
  parentId: null,
  hierarchyPath: [] as string[],   // root has empty path
  hierarchyLevel: 0,
  provinceTerritory: null,
  sectors: [] as [],
  email: 'info@clc-ctc.ca',
  website: 'https://canadianlabour.ca',
  clcAffiliated: true,
  memberCount: 3_000_000,
  activeMemberCount: 3_000_000,
  status: 'active',
  settings: {
    perCapitaRate: 0.54, // CLC per-capita rate per member per month
    remittanceDay: 15,
    fiscalYearEnd: 'December 31',
  },
  featuresEnabled: [
    'federation-management',
    'aggregate-reporting',
    'benchmark-suite',
    'clc-integration',
    'cross-federation-collaboration',
  ],
};

// ──────────────────────────────────────────────────────────────────
// Provincial / Territorial Federations
// ──────────────────────────────────────────────────────────────────

interface FederationDef {
  name: string;
  slug: string;
  shortName: string;
  province: string;           // Must match caJurisdictionEnum values
  memberCount: number;
}

const FEDERATIONS: FederationDef[] = [
  { name: 'Alberta Federation of Labour',                     slug: 'afl',      shortName: 'AFL',      province: 'AB', memberCount: 175_000 },
  { name: 'BC Federation of Labour',                          slug: 'bcfed',    shortName: 'BCFED',    province: 'BC', memberCount: 500_000 },
  { name: 'Manitoba Federation of Labour',                    slug: 'mfl',      shortName: 'MFL',      province: 'MB', memberCount: 100_000 },
  { name: 'New Brunswick Federation of Labour',               slug: 'nbfl',     shortName: 'NBFL',     province: 'NB', memberCount: 40_000  },
  { name: 'Newfoundland and Labrador Federation of Labour',   slug: 'nlfl',     shortName: 'NLFL',     province: 'NL', memberCount: 65_000  },
  { name: 'Nova Scotia Federation of Labour',                 slug: 'nsfl',     shortName: 'NSFL',     province: 'NS', memberCount: 75_000  },
  { name: 'Northwest Territories Federation of Labour',       slug: 'nwtfl',    shortName: 'NWTFL',    province: 'NT', memberCount: 5_000   },
  { name: 'Nunavut Employees Union',                          slug: 'nueu',     shortName: 'NUEU',     province: 'NU', memberCount: 3_000   },
  { name: 'Ontario Federation of Labour',                     slug: 'ofl',      shortName: 'OFL',      province: 'ON', memberCount: 1_000_000 },
  { name: 'PEI Federation of Labour',                         slug: 'peifl',    shortName: 'PEIFL',    province: 'PE', memberCount: 12_000  },
  { name: 'Fédération des travailleurs et travailleuses du Québec', slug: 'ftq', shortName: 'FTQ',    province: 'QC', memberCount: 600_000 },
  { name: 'Saskatchewan Federation of Labour',                slug: 'sfl',      shortName: 'SFL',      province: 'SK', memberCount: 100_000 },
  { name: 'Yukon Federation of Labour',                       slug: 'yfl',      shortName: 'YFL',      province: 'YT', memberCount: 4_000   },
];

// ──────────────────────────────────────────────────────────────────
// National / International Union Affiliates (Level 1)
// ──────────────────────────────────────────────────────────────────

interface AffiliateDef {
  name: string;
  slug: string;
  shortName: string;
  sectors: ('healthcare' | 'education' | 'public_service' | 'trades' | 'manufacturing' | 'transportation' | 'retail' | 'hospitality' | 'technology' | 'construction' | 'utilities' | 'telecommunications' | 'financial_services' | 'agriculture' | 'arts_culture' | 'other')[];
  memberCount: number;
  website?: string;
  description: string;
}

const AFFILIATES: AffiliateDef[] = [
  {
    name: 'Canadian Union of Public Employees',
    slug: 'cupe',
    shortName: 'CUPE',
    sectors: ['public_service', 'healthcare', 'education'],
    memberCount: 700_000,
    website: 'https://cupe.ca',
    description: 'Canada\'s largest union — 700,000 members in healthcare, education, municipalities, libraries, utilities, and more.',
  },
  {
    name: 'Unifor',
    slug: 'unifor',
    shortName: 'Unifor',
    sectors: ['manufacturing', 'transportation', 'telecommunications'],
    memberCount: 315_000,
    website: 'https://unifor.org',
    description: 'Canada\'s largest private-sector union — auto, aerospace, media, telecom, transportation, and more.',
  },
  {
    name: 'United Food and Commercial Workers Canada',
    slug: 'ufcw',
    shortName: 'UFCW',
    sectors: ['retail', 'agriculture', 'hospitality'],
    memberCount: 250_000,
    website: 'https://ufcw.ca',
    description: 'Representing workers in food processing, retail, hospitality, and agriculture across Canada.',
  },
  {
    name: 'United Steelworkers',
    slug: 'usw',
    shortName: 'USW',
    sectors: ['manufacturing', 'trades'],
    memberCount: 225_000,
    website: 'https://usw.ca',
    description: 'One of North America\'s largest industrial unions — steel, mining, forestry, energy, and manufacturing.',
  },
  {
    name: 'Public Service Alliance of Canada',
    slug: 'psac',
    shortName: 'PSAC',
    sectors: ['public_service'],
    memberCount: 215_000,
    website: 'https://psacunion.ca',
    description: 'The union of Canada\'s federal public service — CRA, CBSA, Parks Canada, Indigenous Services, and more.',
  },
  {
    name: 'Canadian Federation of Nurses Unions',
    slug: 'cfnu',
    shortName: 'CFNU',
    sectors: ['healthcare'],
    memberCount: 200_000,
    website: 'https://nursesunions.ca',
    description: 'National federation representing nurses across all provinces and territories.',
  },
  {
    name: 'Teamsters Canada',
    slug: 'teamsters',
    shortName: 'Teamsters',
    sectors: ['transportation', 'retail'],
    memberCount: 125_000,
    website: 'https://teamsters.ca',
    description: 'Freight, parcel, airline, rail, brewery, and warehouse workers across Canada.',
  },
  {
    name: 'Service Employees International Union',
    slug: 'seiu',
    shortName: 'SEIU',
    sectors: ['healthcare', 'public_service'],
    memberCount: 100_000,
    website: 'https://seiulocal2.ca',
    description: 'Healthcare, property services, and public-sector workers across Canada.',
  },
  {
    name: 'International Brotherhood of Electrical Workers — Canada',
    slug: 'ibew-ca',
    shortName: 'IBEW',
    sectors: ['trades', 'construction', 'utilities'],
    memberCount: 70_000,
    website: 'https://ibew.org',
    description: 'Electricians, lineworkers, and utility technicians in construction and maintenance.',
  },
  {
    name: 'Canadian Union of Postal Workers',
    slug: 'cupw',
    shortName: 'CUPW',
    sectors: ['public_service', 'transportation'],
    memberCount: 55_000,
    website: 'https://cupw-sttp.org',
    description: 'Letter carriers, postal clerks, and RSMCs delivering mail from coast to coast.',
  },
  {
    name: 'International Association of Machinists and Aerospace Workers',
    slug: 'iamaw',
    shortName: 'IAMAW',
    sectors: ['manufacturing', 'transportation'],
    memberCount: 50_000,
    website: 'https://iamaw.ca',
    description: 'Aerospace, airline, rail, and precision-manufacturing workers in Canada.',
  },
  {
    name: 'Alliance of Canadian Cinema, Television and Radio Artists',
    slug: 'actra',
    shortName: 'ACTRA',
    sectors: ['arts_culture'],
    memberCount: 28_000,
    website: 'https://actra.ca',
    description: 'Performers in film, television, radio, and digital media across Canada.',
  },
];

// ──────────────────────────────────────────────────────────────────
// Seeder
// ──────────────────────────────────────────────────────────────────

export interface SeedResult {
  clcId: string | null;
  federationsCreated: number;
  affiliatesCreated: number;
  relationshipsCreated: number;
  skipped: string[];
}

/**
 * Idempotent seed: inserts CLC + 13 federations + 12 national affiliates + relationships.
 * Returns a summary of what was created vs. skipped.
 */
export async function seedOrganizationHierarchy(): Promise<SeedResult> {
  const result: SeedResult = {
    clcId: null,
    federationsCreated: 0,
    affiliatesCreated: 0,
    relationshipsCreated: 0,
    skipped: [],
  };

  // 1. Upsert CLC ──────────────────────────────────────────────
  const [clcRow] = await db
    .insert(organizations)
    .values(CLC_ORG)
    .onConflictDoNothing({ target: organizations.slug })
    .returning({ id: organizations.id });

  if (clcRow) {
    result.clcId = clcRow.id;
  } else {
    // Already exists — look it up
    const existing = await db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.slug, 'clc'),
      columns: { id: true },
    });
    result.clcId = existing?.id ?? null;
    result.skipped.push('clc (already exists)');
  }

  if (!result.clcId) {
    throw new Error('Failed to resolve CLC organization id');
  }

  // 2. Upsert federations ──────────────────────────────────────
  for (const fed of FEDERATIONS) {
    const fedValues = {
      name: fed.name,
      slug: fed.slug,
      displayName: fed.shortName,
      shortName: fed.shortName,
      description: `${fed.name} — Provincial federation of labour for ${fed.province}.`,
      organizationType: 'federation' as const,
      parentId: result.clcId,
      hierarchyPath: [result.clcId],
      hierarchyLevel: 1,
      provinceTerritory: fed.province,
      sectors: [] as [],
      clcAffiliated: true,
      memberCount: fed.memberCount,
      activeMemberCount: fed.memberCount,
      status: 'active',
      settings: {
        perCapitaRate: 0.54,
        remittanceDay: 15,
        fiscalYearEnd: 'December 31',
      },
      featuresEnabled: [
        'local-management',
        'federation-reporting',
        'shared-clause-library',
        'inter-union-messaging',
      ],
    };

    const [fedRow] = await db
      .insert(organizations)
      .values(fedValues)
      .onConflictDoNothing({ target: organizations.slug })
      .returning({ id: organizations.id });

    if (fedRow) {
      result.federationsCreated++;

      // Create relationship record: CLC → Federation (affiliate)
      await db
        .insert(organizationRelationships)
        .values({
          parentOrgId: result.clcId,
          childOrgId: fedRow.id,
          relationshipType: 'affiliate',
          effectiveDate: new Date().toISOString().split('T')[0],
          notes: `${fed.shortName} affiliated to CLC`,
        })
        .onConflictDoNothing();

      result.relationshipsCreated++;
    } else {
      result.skipped.push(`${fed.slug} (already exists)`);
    }
  }

  // 3. Upsert national / international union affiliates ──────────
  for (const aff of AFFILIATES) {
    const affValues = {
      name: aff.name,
      slug: aff.slug,
      displayName: aff.shortName,
      shortName: aff.shortName,
      description: aff.description,
      organizationType: 'union' as const,
      parentId: result.clcId,
      hierarchyPath: [result.clcId],
      hierarchyLevel: 1,
      provinceTerritory: null,               // national scope
      sectors: aff.sectors,
      email: null,
      website: aff.website ?? null,
      clcAffiliated: true,
      memberCount: aff.memberCount,
      activeMemberCount: aff.memberCount,
      status: 'active',
      settings: {
        perCapitaRate: 0.54,
        remittanceDay: 15,
        fiscalYearEnd: 'December 31',
      },
      featuresEnabled: [
        'grievance-management',
        'member-portal',
        'contract-management',
        'dues-tracking',
      ],
    };

    const [affRow] = await db
      .insert(organizations)
      .values(affValues)
      .onConflictDoNothing({ target: organizations.slug })
      .returning({ id: organizations.id });

    if (affRow) {
      result.affiliatesCreated++;

      // Relationship: CLC → National Union (affiliate)
      await db
        .insert(organizationRelationships)
        .values({
          parentOrgId: result.clcId,
          childOrgId: affRow.id,
          relationshipType: 'affiliate',
          effectiveDate: new Date().toISOString().split('T')[0],
          notes: `${aff.shortName} affiliated to CLC`,
        })
        .onConflictDoNothing();

      result.relationshipsCreated++;
    } else {
      result.skipped.push(`${aff.slug} (already exists)`);
    }
  }

  return result;
}

// ──────────────────────────────────────────────────────────────────
// CLI entrypoint (npx tsx db/seeds/seed-org-hierarchy.ts)
// ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏛️  Seeding CLC organization hierarchy …');
  const result = await seedOrganizationHierarchy();
  console.log('✅ Done!');
  console.log(`   CLC id:               ${result.clcId}`);
  console.log(`   Federations created:   ${result.federationsCreated}`);
  console.log(`   Affiliates created:    ${result.affiliatesCreated}`);
  console.log(`   Relationships created: ${result.relationshipsCreated}`);
  if (result.skipped.length) {
    console.log(`   Skipped (idempotent):  ${result.skipped.join(', ')}`);
  }
  process.exit(0);
}

// Only run as CLI when executed directly (not when imported)
if (typeof require !== 'undefined' && require.main === module) {
  main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
