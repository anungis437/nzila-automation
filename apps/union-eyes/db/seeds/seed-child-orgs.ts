/**
 * Seed: Sample child organizations (locals, chapters, district labour councils)
 *
 * Pre-creates representative local unions and district labour councils
 * under the top-level national unions and provincial federations seeded
 * by seed-org-hierarchy.ts.
 *
 * Structure seeded:
 *   CUPE     → CUPE Local 79 (Toronto), CUPE Local 3903 (Toronto), CUPE Local 1000 (Ottawa)
 *   Unifor   → Unifor Local 444 (Windsor), Unifor Local 2002 (National)
 *   UFCW     → UFCW Local 401 (Alberta), UFCW Local 1006A (Ontario)
 *   USW      → USW Local 1005 (Hamilton), USW Local 6500 (Sudbury)
 *   PSAC     → PSAC Local 00017 (National Capital Region)
 *   Teamsters→ Teamsters Local 879 (BC)
 *   IBEW     → IBEW Local 353 (Toronto)
 *   OFL      → Toronto & York Region Labour Council (district)
 *   BCFED    → Vancouver & District Labour Council (district)
 *
 * Idempotent: uses ON CONFLICT (slug) DO NOTHING.
 *
 * Usage:
 *   npx tsx apps/union-eyes/db/seeds/seed-child-orgs.ts
 *   — or via the /api/admin/seed-test-data POST endpoint
 */

import { db } from '@/db/db';
import { organizations, organizationRelationships, labourSectorEnum } from '@/db/schema-organizations';

type LabourSector = (typeof labourSectorEnum.enumValues)[number];

// ──────────────────────────────────────────────────────────────────
// Child org definitions
// ──────────────────────────────────────────────────────────────────

interface ChildOrg {
  name: string;
  slug: string;
  shortName: string;
  parentSlug: string; // slug of the parent org (must already exist)
  organizationType: 'local' | 'district';
  provinceTerritory: string | null;
  sectors: LabourSector[];
  memberCount: number;
  description: string;
  charterNumber?: string;
}

const CHILD_ORGS: ChildOrg[] = [
  // ── CUPE Locals ──────────────────────────────────────────────
  {
    name: 'CUPE Local 79',
    slug: 'cupe-local-79',
    shortName: 'CUPE 79',
    parentSlug: 'cupe',
    organizationType: 'local',
    provinceTerritory: 'ON',
    sectors: ['public_service'],
    memberCount: 25_000,
    description: 'City of Toronto inside workers — the largest CUPE local in Canada.',
    charterNumber: 'CUPE-ON-079',
  },
  {
    name: 'CUPE Local 3903',
    slug: 'cupe-local-3903',
    shortName: 'CUPE 3903',
    parentSlug: 'cupe',
    organizationType: 'local',
    provinceTerritory: 'ON',
    sectors: ['education'],
    memberCount: 3_800,
    description: 'York University contract faculty, teaching assistants, and graduate assistants.',
    charterNumber: 'CUPE-ON-3903',
  },
  {
    name: 'CUPE Local 1000',
    slug: 'cupe-local-1000',
    shortName: 'CUPE 1000',
    parentSlug: 'cupe',
    organizationType: 'local',
    provinceTerritory: 'ON',
    sectors: ['public_service'],
    memberCount: 4_500,
    description: 'Regional municipality workers in the Ottawa–Carleton region.',
    charterNumber: 'CUPE-ON-1000',
  },

  // ── Unifor Locals ───────────────────────────────────────────
  {
    name: 'Unifor Local 444',
    slug: 'unifor-local-444',
    shortName: 'Unifor 444',
    parentSlug: 'unifor',
    organizationType: 'local',
    provinceTerritory: 'ON',
    sectors: ['manufacturing'],
    memberCount: 12_000,
    description: 'Windsor-area Stellantis (formerly Chrysler) assembly and manufacturing workers.',
    charterNumber: 'UNI-ON-444',
  },
  {
    name: 'Unifor Local 2002',
    slug: 'unifor-local-2002',
    shortName: 'Unifor 2002',
    parentSlug: 'unifor',
    organizationType: 'local',
    provinceTerritory: null, // national scope
    sectors: ['transportation'],
    memberCount: 7_000,
    description: 'Airline workers — Air Canada, Jazz Aviation, and airport services.',
    charterNumber: 'UNI-NAT-2002',
  },

  // ── UFCW Locals ─────────────────────────────────────────────
  {
    name: 'UFCW Local 401',
    slug: 'ufcw-local-401',
    shortName: 'UFCW 401',
    parentSlug: 'ufcw',
    organizationType: 'local',
    provinceTerritory: 'AB',
    sectors: ['retail', 'agriculture'],
    memberCount: 32_000,
    description: `Alberta's largest private-sector local — Safeway, Sobeys, Cargill, and hospitality.`,
    charterNumber: 'UFCW-AB-401',
  },
  {
    name: 'UFCW Local 1006A',
    slug: 'ufcw-local-1006a',
    shortName: 'UFCW 1006A',
    parentSlug: 'ufcw',
    organizationType: 'local',
    provinceTerritory: 'ON',
    sectors: ['retail', 'hospitality'],
    memberCount: 35_000,
    description: 'Ontario food retail and hospitality — Loblaw, Maple Leaf, hotels, gaming.',
    charterNumber: 'UFCW-ON-1006A',
  },

  // ── USW Locals ──────────────────────────────────────────────
  {
    name: 'USW Local 1005',
    slug: 'usw-local-1005',
    shortName: 'USW 1005',
    parentSlug: 'usw',
    organizationType: 'local',
    provinceTerritory: 'ON',
    sectors: ['manufacturing'],
    memberCount: 2_200,
    description: `ArcelorMittal Dofasco steelworkers in Hamilton — one of Canada's historic steel locals.`,
    charterNumber: 'USW-ON-1005',
  },
  {
    name: 'USW Local 6500',
    slug: 'usw-local-6500',
    shortName: 'USW 6500',
    parentSlug: 'usw',
    organizationType: 'local',
    provinceTerritory: 'ON',
    sectors: ['manufacturing', 'trades'],
    memberCount: 4_000,
    description: 'Vale nickel mine and smelter workers in Sudbury — largest mining local in Canada.',
    charterNumber: 'USW-ON-6500',
  },

  // ── PSAC Local ──────────────────────────────────────────────
  {
    name: 'PSAC Local 00017',
    slug: 'psac-local-00017',
    shortName: 'PSAC 00017',
    parentSlug: 'psac',
    organizationType: 'local',
    provinceTerritory: 'ON',
    sectors: ['public_service'],
    memberCount: 1_800,
    description: 'National Capital Region federal public servants — CRA headquarters bargaining unit.',
    charterNumber: 'PSAC-ON-00017',
  },

  // ── Teamsters Local ─────────────────────────────────────────
  {
    name: 'Teamsters Local 879',
    slug: 'teamsters-local-879',
    shortName: 'Teamsters 879',
    parentSlug: 'teamsters',
    organizationType: 'local',
    provinceTerritory: 'BC',
    sectors: ['transportation'],
    memberCount: 3_500,
    description: 'British Columbia freight, warehousing, and courier workers.',
    charterNumber: 'TM-BC-879',
  },

  // ── IBEW Local ──────────────────────────────────────────────
  {
    name: 'IBEW Local 353',
    slug: 'ibew-local-353',
    shortName: 'IBEW 353',
    parentSlug: 'ibew-ca',
    organizationType: 'local',
    provinceTerritory: 'ON',
    sectors: ['trades', 'construction'],
    memberCount: 10_000,
    description: 'Greater Toronto Area electricians — construction, maintenance, and power systems.',
    charterNumber: 'IBEW-ON-353',
  },

  // ── District Labour Councils (under federations) ────────────
  {
    name: 'Toronto & York Region Labour Council',
    slug: 'tyrlc',
    shortName: 'TYRLC',
    parentSlug: 'ofl',
    organizationType: 'district',
    provinceTerritory: 'ON',
    sectors: [],
    memberCount: 200_000,
    description: 'CLC-chartered labour council for the City of Toronto and York Region — largest in Canada.',
  },
  {
    name: 'Vancouver & District Labour Council',
    slug: 'vdlc',
    shortName: 'VDLC',
    parentSlug: 'bcfed',
    organizationType: 'district',
    provinceTerritory: 'BC',
    sectors: [],
    memberCount: 120_000,
    description: 'CLC-chartered labour council for Metro Vancouver and surrounding districts.',
  },
];

// ──────────────────────────────────────────────────────────────────
// Seeder
// ──────────────────────────────────────────────────────────────────

export interface ChildSeedResult {
  localsCreated: number;
  districtsCreated: number;
  relationshipsCreated: number;
  skipped: string[];
  errors: string[];
}

/**
 * Idempotent seed: inserts sample locals + district labour councils
 * under existing parent orgs. Parents must already be seeded.
 */
export async function seedChildOrganizations(): Promise<ChildSeedResult> {
  const result: ChildSeedResult = {
    localsCreated: 0,
    districtsCreated: 0,
    relationshipsCreated: 0,
    skipped: [],
    errors: [],
  };

  // Resolve all parent slugs → ids in one query
  const parentSlugs = [...new Set(CHILD_ORGS.map(c => c.parentSlug))];
  const parentRows = await db.query.organizations.findMany({
    where: (o, { inArray }) => inArray(o.slug, parentSlugs),
    columns: { id: true, slug: true },
  });
  const parentMap = new Map(parentRows.map(r => [r.slug, r.id]));

  for (const child of CHILD_ORGS) {
    const parentId = parentMap.get(child.parentSlug);
    if (!parentId) {
      result.errors.push(`${child.slug}: parent ${child.parentSlug} not found — skipped`);
      continue;
    }

    const childValues = {
      name: child.name,
      slug: child.slug,
      displayName: child.shortName,
      shortName: child.shortName,
      description: child.description,
      organizationType: child.organizationType as 'local' | 'district',
      parentId,
      hierarchyPath: [parentId],
      hierarchyLevel: child.organizationType === 'district' ? 2 : 3,
      provinceTerritory: child.provinceTerritory,
      sectors: child.sectors,
      clcAffiliated: true,
      memberCount: child.memberCount,
      activeMemberCount: child.memberCount,
      status: 'active',
      charterNumber: child.charterNumber ?? null,
      settings: {
        perCapitaRate: 0.54,
        remittanceDay: 15,
      },
      featuresEnabled: [
        'grievance-management',
        'member-portal',
        'dues-tracking',
      ],
    };

    const [row] = await db
      .insert(organizations)
      .values(childValues)
      .onConflictDoNothing({ target: organizations.slug })
      .returning({ id: organizations.id });

    if (row) {
      if (child.organizationType === 'local') result.localsCreated++;
      else result.districtsCreated++;

      // Create relationship
      await db
        .insert(organizationRelationships)
        .values({
          parentOrgId: parentId,
          childOrgId: row.id,
          relationshipType: child.organizationType === 'district' ? 'district' as const : 'affiliate' as const,
          effectiveDate: new Date().toISOString().split('T')[0],
          notes: `${child.shortName} under ${child.parentSlug}`,
        })
        .onConflictDoNothing();

      result.relationshipsCreated++;
    } else {
      result.skipped.push(`${child.slug} (already exists)`);
    }
  }

  return result;
}

// ──────────────────────────────────────────────────────────────────
// CLI entrypoint
// ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏗️  Seeding child organizations (locals + district labour councils) …');
  const result = await seedChildOrganizations();
  console.log('✅ Done!');
  console.log(`   Locals created:        ${result.localsCreated}`);
  console.log(`   Districts created:     ${result.districtsCreated}`);
  console.log(`   Relationships created: ${result.relationshipsCreated}`);
  if (result.skipped.length) {
    console.log(`   Skipped (idempotent):  ${result.skipped.join(', ')}`);
  }
  if (result.errors.length) {
    console.log(`   Errors:                ${result.errors.join(', ')}`);
  }
  process.exit(0);
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
