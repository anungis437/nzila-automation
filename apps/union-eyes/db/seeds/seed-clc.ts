/**
 * Seed: Canadian Labour Congress (CLC)
 *
 * Provisions the CLC as the root congress organization in the Union Eyes
 * platform hierarchy.  Once created, affiliate unions (like CAPE-ACEP)
 * can be linked to CLC as children.
 *
 * Creates:
 *   1. CLC organization record (congress, hierarchy root)
 *   2. Default per-capita dues rule (monthly flat per member)
 *   3. Organization sharing settings (federation-level defaults)
 *
 * CLC background:
 *   - Represents ~3 million Canadian workers across 56 affiliates
 *   - Founded 1956 (merger of TLC and CCL)
 *   - Headquarters: Ottawa, ON
 *   - Governance: triennial convention, executive council
 *   - Per-capita: affiliates remit monthly per member
 *
 * Idempotent: uses ON CONFLICT (slug) DO NOTHING so it is safe to
 * re-run without duplicating data.
 *
 * Usage:
 *   npx tsx apps/union-eyes/db/seeds/seed-clc.ts
 */

import { db } from '@/db/db';
import { organizations } from '@/db/schema-organizations';
import { sql } from 'drizzle-orm';

// ──────────────────────────────────────────────────────────────────
// CLC Organization
// ──────────────────────────────────────────────────────────────────

const CLC_ORG = {
  name: 'Canadian Labour Congress',
  slug: 'clc',
  displayName: 'CLC',
  shortName: 'CLC',
  organizationType: 'congress' as const,
  parentId: null,
  hierarchyPath: [] as string[],
  hierarchyLevel: 0, // root of hierarchy
  provinceTerritory: 'ON',
  sectors: [],
  email: 'info@clc-ctc.ca',
  phone: '613-521-3400',
  website: 'https://canadianlabour.ca',
  address: {
    street: '2841 Riverside Drive',
    city: 'Ottawa',
    province: 'ON',
    postal_code: 'K1V 8X7',
    country: 'CA',
  },
  clcAffiliated: false, // CLC *is* the congress — affiliates are affiliated to it
  affiliationDate: null,
  charterNumber: null,
  memberCount: 3_000_000,
  activeMemberCount: 3_000_000,
  status: 'active',
  clcAffiliateCode: 'CLC',
  perCapitaRate: '0.54',
  remittanceDay: 15,
  fiscalYearEnd: '2024-12-31',
  settings: {
    perCapitaRate: 0.54,
    remittanceDay: 15,
    fiscalYearEnd: 'December 31',
    governanceModel: 'triennial_convention',
    executiveCouncil: true,
    affiliateCount: 56,
    language: 'bilingual',
  },
  featuresEnabled: [
    'dues-management',
    'member-directory',
    'financial-reporting',
    'per-capita-remittances',
    'clc-integration',
    'affiliate-management',
    'convention-governance',
  ],
};

// ──────────────────────────────────────────────────────────────────
// Default Per-Capita Dues Rule
// ──────────────────────────────────────────────────────────────────

const CLC_DUES_RULE = {
  ruleName: 'CLC Standard Per-Capita',
  ruleCode: 'CLC-PERCAP',
  description:
    'Standard CLC per-capita rate — flat amount per member per month remitted by affiliates.',
  calculationType: 'flat',
  percentageRate: null,
  flatAmount: '0.54',
  baseField: null,
  billingFrequency: 'monthly',
  isActive: true,
  effectiveDate: '2025-01-01',
};

// ──────────────────────────────────────────────────────────────────
// Organization Sharing Settings
// ──────────────────────────────────────────────────────────────────

const CLC_SHARING_SETTINGS = {
  allowFederationSharing: true,   // CLC enables cross-federation visibility
  allowSectorSharing: true,
  allowProvinceSharing: true,
  allowCongressSharing: true,     // congress-level sharing enabled
  autoShareClauses: false,
  autoSharePrecedents: false,
  requireAnonymization: true,
  defaultSharingLevel: 'congress',
  allowedSharingLevels: ['private', 'congress'],
  sharingApprovalRequired: true,
  sharingApproverRole: 'admin',
};

// ──────────────────────────────────────────────────────────────────
// Result type
// ──────────────────────────────────────────────────────────────────

export interface ClcSeedResult {
  organizationId: string | null;
  duesRuleCreated: boolean;
  sharingSettingsCreated: boolean;
  skipped: string[];
}

// ──────────────────────────────────────────────────────────────────
// Seed function
// ──────────────────────────────────────────────────────────────────

export async function seedClc(): Promise<ClcSeedResult> {
  const result: ClcSeedResult = {
    organizationId: null,
    duesRuleCreated: false,
    sharingSettingsCreated: false,
    skipped: [],
  };

  // 1. Insert CLC organization
  const [clcRow] = await db
    .insert(organizations)
    .values(CLC_ORG)
    .onConflictDoNothing({ target: organizations.slug })
    .returning({ id: organizations.id });

  if (clcRow) {
    result.organizationId = clcRow.id;
  } else {
    const existing = await db.query.organizations.findFirst({
      where: (o, { eq: eqFn }) => eqFn(o.slug, 'clc'),
      columns: { id: true },
    });
    result.organizationId = existing?.id ?? null;
    result.skipped.push('clc organization (already exists)');
  }

  if (!result.organizationId) {
    console.error('Failed to create or find CLC organization');
    return result;
  }

  // 2. Insert dues rule
  try {
    await db.execute(
      sql`
      INSERT INTO dues_rules (
        organization_id, rule_name, rule_code, description,
        calculation_type, flat_amount,
        billing_frequency, is_active, effective_date
      ) VALUES (
        ${result.organizationId},
        ${CLC_DUES_RULE.ruleName},
        ${CLC_DUES_RULE.ruleCode},
        ${CLC_DUES_RULE.description},
        ${CLC_DUES_RULE.calculationType},
        ${CLC_DUES_RULE.flatAmount},
        ${CLC_DUES_RULE.billingFrequency},
        ${CLC_DUES_RULE.isActive},
        ${CLC_DUES_RULE.effectiveDate}
      )
      ON CONFLICT (organization_id, rule_code) DO NOTHING
    `
    );
    result.duesRuleCreated = true;
  } catch (err) {
    result.skipped.push(`dues rule: ${err instanceof Error ? err.message : 'unknown error'}`);
  }

  // 3. Insert sharing settings
  try {
    await db.execute(
      sql`
      INSERT INTO organization_sharing_settings (
        organization_id,
        allow_federation_sharing, allow_sector_sharing,
        allow_province_sharing, allow_congress_sharing,
        auto_share_clauses, auto_share_precedents,
        require_anonymization, default_sharing_level,
        allowed_sharing_levels, sharing_approval_required,
        sharing_approver_role
      ) VALUES (
        ${result.organizationId},
        ${CLC_SHARING_SETTINGS.allowFederationSharing},
        ${CLC_SHARING_SETTINGS.allowSectorSharing},
        ${CLC_SHARING_SETTINGS.allowProvinceSharing},
        ${CLC_SHARING_SETTINGS.allowCongressSharing},
        ${CLC_SHARING_SETTINGS.autoShareClauses},
        ${CLC_SHARING_SETTINGS.autoSharePrecedents},
        ${CLC_SHARING_SETTINGS.requireAnonymization},
        ${CLC_SHARING_SETTINGS.defaultSharingLevel},
        ${sql.raw(`'{${CLC_SHARING_SETTINGS.allowedSharingLevels.join(',')}}'`)},
        ${CLC_SHARING_SETTINGS.sharingApprovalRequired},
        ${CLC_SHARING_SETTINGS.sharingApproverRole}
      )
      ON CONFLICT (organization_id) DO NOTHING
    `
    );
    result.sharingSettingsCreated = true;
  } catch (err) {
    result.skipped.push(`sharing settings: ${err instanceof Error ? err.message : 'unknown error'}`);
  }

  return result;
}

// ──────────────────────────────────────────────────────────────────
// CLI entry-point
// ──────────────────────────────────────────────────────────────────

if (require.main === module) {
  seedClc()
    .then((res) => {
      console.log('\n✅ CLC seed complete');
      console.log(`   Organization ID    : ${res.organizationId}`);
      console.log(`   Dues rule          : ${res.duesRuleCreated ? 'created' : 'skipped'}`);
      console.log(`   Sharing settings   : ${res.sharingSettingsCreated ? 'created' : 'skipped'}`);
      if (res.skipped.length > 0) {
        console.log(`   Skipped            : ${res.skipped.join('; ')}`);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ CLC seed failed:', err);
      process.exit(1);
    });
}
