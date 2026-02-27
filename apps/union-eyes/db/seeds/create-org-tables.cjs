/**
 * Creates the organizations-related tables required by the CAPE-ACEP seed.
 * Uses raw pg client to execute DDL on the staging database.
 * Idempotent: all statements use IF NOT EXISTS / ON CONFLICT.
 */
const pg = require('pg');

async function main() {
  const client = new pg.Client(process.env.DATABASE_URL);
  await client.connect();
  console.log('Connected to', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0]);

  // Create enums (IF NOT EXISTS via DO block)
  const enums = [
    { name: 'organization_type', values: ['platform','congress','federation','union','local','region','district'] },
    { name: 'ca_jurisdiction', values: ['federal','AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'] },
    { name: 'labour_sector', values: ['healthcare','education','public_service','trades','manufacturing','transportation','retail','hospitality','technology','construction','utilities','telecommunications','financial_services','agriculture','arts_culture','other'] },
    { name: 'organization_status', values: ['active','inactive','suspended','archived'] },
    { name: 'organization_relationship_type', values: ['affiliate','federation','local','chapter','region','district','joint_council','merged_from','split_from'] },
  ];

  for (const e of enums) {
    const vals = e.values.map(v => `'${v}'`).join(', ');
    await client.query(`DO $$ BEGIN CREATE TYPE ${e.name} AS ENUM (${vals}); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    console.log(`  enum ${e.name}: OK`);
  }

  // Create organizations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      display_name TEXT,
      short_name TEXT,
      description TEXT,
      organization_type organization_type NOT NULL,
      parent_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
      hierarchy_path TEXT[] NOT NULL DEFAULT '{}',
      hierarchy_level INTEGER NOT NULL DEFAULT 0,
      province_territory TEXT,
      sectors labour_sector[] DEFAULT '{}',
      email TEXT,
      phone TEXT,
      website TEXT,
      address JSONB,
      clc_affiliated BOOLEAN DEFAULT FALSE,
      affiliation_date DATE,
      charter_number TEXT,
      member_count INTEGER DEFAULT 0,
      active_member_count INTEGER DEFAULT 0,
      last_member_count_update TIMESTAMPTZ,
      subscription_tier TEXT,
      billing_contact_id UUID,
      settings JSONB DEFAULT '{}',
      features_enabled TEXT[] DEFAULT '{}',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID,
      legacy_tenant_id UUID,
      clc_affiliate_code VARCHAR(20),
      per_capita_rate NUMERIC(10,2),
      remittance_day INTEGER DEFAULT 15,
      last_remittance_date TIMESTAMPTZ,
      fiscal_year_end DATE DEFAULT '2024-12-31'
    );
  `);
  console.log('  table organizations: OK');

  // Create organization_relationships table
  await client.query(`
    CREATE TABLE IF NOT EXISTS organization_relationships (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      parent_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      child_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      relationship_type organization_relationship_type NOT NULL,
      effective_date DATE NOT NULL DEFAULT NOW(),
      end_date DATE,
      notes TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID
    );
  `);
  console.log('  table organization_relationships: OK');

  // Create organization_members table
  await client.query(`
    CREATE TABLE IF NOT EXISTS organization_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      tenant_id UUID,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      is_primary BOOLEAN DEFAULT FALSE,
      department TEXT,
      position TEXT,
      hire_date TIMESTAMPTZ,
      membership_number TEXT,
      seniority INTEGER,
      union_join_date TIMESTAMPTZ,
      preferred_contact_method TEXT,
      metadata TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );
  `);
  console.log('  table organization_members: OK');

  // Create dues_rules table (needed by seed)
  await client.query(`
    CREATE TABLE IF NOT EXISTS dues_rules (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      rule_name TEXT NOT NULL,
      rule_code TEXT NOT NULL,
      description TEXT,
      calculation_type TEXT NOT NULL,
      percentage_rate NUMERIC(10,4),
      flat_amount NUMERIC(10,2),
      base_field TEXT,
      billing_frequency TEXT NOT NULL DEFAULT 'biweekly',
      is_active BOOLEAN DEFAULT TRUE,
      effective_date DATE NOT NULL DEFAULT NOW(),
      end_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID,
      UNIQUE(organization_id, rule_code)
    );
  `);
  console.log('  table dues_rules: OK');

  // Create organization_sharing_settings table (needed by seed)
  await client.query(`
    CREATE TABLE IF NOT EXISTS organization_sharing_settings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
      allow_federation_sharing BOOLEAN DEFAULT FALSE,
      allow_sector_sharing BOOLEAN DEFAULT FALSE,
      allow_province_sharing BOOLEAN DEFAULT FALSE,
      allow_congress_sharing BOOLEAN DEFAULT FALSE,
      auto_share_clauses BOOLEAN DEFAULT FALSE,
      auto_share_precedents BOOLEAN DEFAULT FALSE,
      require_anonymization BOOLEAN DEFAULT TRUE,
      default_sharing_level TEXT DEFAULT 'private',
      allowed_sharing_levels TEXT[] DEFAULT '{"private"}',
      sharing_approval_required BOOLEAN DEFAULT TRUE,
      sharing_approver_role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('  table organization_sharing_settings: OK');

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_id)',
    'CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type)',
    'CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug)',
    'CREATE INDEX IF NOT EXISTS idx_organizations_hierarchy_level ON organizations(hierarchy_level)',
    'CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status)',
    'CREATE INDEX IF NOT EXISTS idx_organizations_clc_affiliated ON organizations(clc_affiliated)',
    'CREATE INDEX IF NOT EXISTS idx_organizations_legacy_tenant ON organizations(legacy_tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_org_relationships_parent ON organization_relationships(parent_org_id)',
    'CREATE INDEX IF NOT EXISTS idx_org_relationships_child ON organization_relationships(child_org_id)',
    'CREATE INDEX IF NOT EXISTS idx_org_relationships_type ON organization_relationships(relationship_type)',
    'CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id)',
    'CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id)',
  ];

  for (const idx of indexes) {
    await client.query(idx);
  }
  console.log('  indexes: OK');

  // Verify
  const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('organizations','dues_rules','organization_sharing_settings','organization_members','organization_relationships') ORDER BY tablename");
  console.log(`\n✅ ${res.rows.length} tables created:`);
  res.rows.forEach(r => console.log(`  - ${r.tablename}`));

  await client.end();
}

main().catch(e => { console.error('❌ Failed:', e.message); process.exit(1); });
