-- ============================================================
-- STAGING FULL SEED — Nzila Union-Eyes
-- Brings staging DB to full parity with the expected demo state.
--
-- Run via:
--   docker exec -e PGPASSWORD=DGq0sA78YFbInSW5 nzila-postgres \
--     psql -h nzila-staging-db.postgres.database.azure.com \
--     -U nzilaadmin -d nzila_os_staging -p 5432
--
-- Idempotent: all inserts use ON CONFLICT or WHERE NOT EXISTS
-- ============================================================

BEGIN;

-- ============================================================
-- 0. Fix Nzila Platform org type (currently 'congress', should be 'platform')
-- ============================================================
UPDATE organizations
SET organization_type = 'platform',
    hierarchy_level = 0,
    description = 'Nzila Ventures — SaaS platform for Canadian labour organizations.'
WHERE slug = 'nzila-platform';

-- ============================================================
-- 1. CLC Root (Congress)
-- ============================================================
INSERT INTO organizations (
  name, slug, display_name, short_name, description, organization_type,
  parent_id, hierarchy_path, hierarchy_level, province_territory, sectors,
  email, website, clc_affiliated, member_count, active_member_count,
  status, settings, features_enabled
) VALUES (
  'Canadian Labour Congress', 'clc', 'CLC', 'CLC',
  'The Canadian Labour Congress is the national voice of the labour movement, representing 3 million workers.',
  'congress', NULL, '{}', 0, NULL, '{}',
  'info@clc-ctc.ca', 'https://canadianlabour.ca', true, 3000000, 3000000, 'active',
  '{"perCapitaRate": 0.54, "remittanceDay": 15, "fiscalYearEnd": "December 31"}'::jsonb,
  ARRAY['federation-management','aggregate-reporting','benchmark-suite','clc-integration','cross-federation-collaboration']
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2-4. Full Hierarchy: Federations, National Unions, Locals, Relationships
-- ============================================================
DO $$
DECLARE
  clc_id   UUID;
  cupe_id  UUID;
  unifor_id UUID;
  ufcw_id  UUID;
  usw_id   UUID;
  ofl_id   UUID;
  bcfed_id UUID;
  fed_id   UUID;
  aff_id   UUID;
BEGIN
  SELECT id INTO clc_id FROM organizations WHERE slug = 'clc';
  IF clc_id IS NULL THEN
    RAISE EXCEPTION 'CLC organization not found — cannot seed hierarchy';
  END IF;

  -- ========== 2. Provincial / Territorial Federations (13) ==========
  INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, clc_affiliated, member_count, active_member_count, status, settings, features_enabled)
  VALUES
    ('Alberta Federation of Labour',                   'afl',   'AFL',    'AFL',    'Alberta Federation of Labour — Provincial federation for AB.',             'federation', clc_id, ARRAY[clc_id::text], 1, 'AB', '{}', true, 175000, 175000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('BC Federation of Labour',                        'bcfed', 'BCFED',  'BCFED',  'BC Federation of Labour — Provincial federation for BC.',                  'federation', clc_id, ARRAY[clc_id::text], 1, 'BC', '{}', true, 500000, 500000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Manitoba Federation of Labour',                  'mfl',   'MFL',    'MFL',    'Manitoba Federation of Labour — Provincial federation for MB.',            'federation', clc_id, ARRAY[clc_id::text], 1, 'MB', '{}', true, 100000, 100000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('New Brunswick Federation of Labour',             'nbfl',  'NBFL',   'NBFL',   'New Brunswick Federation of Labour — Provincial federation for NB.',       'federation', clc_id, ARRAY[clc_id::text], 1, 'NB', '{}', true, 40000,  40000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Newfoundland and Labrador Federation of Labour', 'nlfl',  'NLFL',   'NLFL',   'NL Federation of Labour — Provincial federation for NL.',                  'federation', clc_id, ARRAY[clc_id::text], 1, 'NL', '{}', true, 65000,  65000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Nova Scotia Federation of Labour',               'nsfl',  'NSFL',   'NSFL',   'Nova Scotia Federation of Labour — Provincial federation for NS.',         'federation', clc_id, ARRAY[clc_id::text], 1, 'NS', '{}', true, 75000,  75000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Northwest Territories Federation of Labour',     'nwtfl', 'NWTFL',  'NWTFL',  'NWT Federation of Labour — Territorial federation for NT.',                'federation', clc_id, ARRAY[clc_id::text], 1, 'NT', '{}', true, 5000,   5000,   'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Nunavut Employees Union',                        'nueu',  'NUEU',   'NUEU',   'Nunavut Employees Union — Territorial federation for NU.',                 'federation', clc_id, ARRAY[clc_id::text], 1, 'NU', '{}', true, 3000,   3000,   'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Ontario Federation of Labour',                   'ofl',   'OFL',    'OFL',    'Ontario Federation of Labour — Provincial federation for ON.',             'federation', clc_id, ARRAY[clc_id::text], 1, 'ON', '{}', true, 1000000,1000000,'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('PEI Federation of Labour',                       'peifl', 'PEIFL',  'PEIFL',  'PEI Federation of Labour — Provincial federation for PE.',                'federation', clc_id, ARRAY[clc_id::text], 1, 'PE', '{}', true, 12000,  12000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Fédération des travailleurs et travailleuses du Québec', 'ftq', 'FTQ', 'FTQ', 'FTQ — Provincial federation for QC.',                                    'federation', clc_id, ARRAY[clc_id::text], 1, 'QC', '{}', true, 600000, 600000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Saskatchewan Federation of Labour',              'sfl',   'SFL',    'SFL',    'Saskatchewan Federation of Labour — Provincial federation for SK.',        'federation', clc_id, ARRAY[clc_id::text], 1, 'SK', '{}', true, 100000, 100000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Yukon Federation of Labour',                     'yfl',   'YFL',    'YFL',    'Yukon Federation of Labour — Territorial federation for YT.',              'federation', clc_id, ARRAY[clc_id::text], 1, 'YT', '{}', true, 4000,   4000,   'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging'])
  ON CONFLICT (slug) DO NOTHING;

  -- Federation relationships (idempotent via NOT EXISTS)
  FOR fed_id IN SELECT id FROM organizations WHERE organization_type = 'federation' AND parent_id = clc_id
  LOOP
    INSERT INTO organization_relationships (parent_org_id, child_org_id, relationship_type, effective_date, notes)
    SELECT clc_id, fed_id, 'affiliate', CURRENT_DATE, 'Provincial/territorial federation affiliated to CLC'
    WHERE NOT EXISTS (
      SELECT 1 FROM organization_relationships
      WHERE parent_org_id = clc_id AND child_org_id = fed_id
    );
  END LOOP;

  -- ========== 3. National / International Union Affiliates (12) ==========
  INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, website, clc_affiliated, member_count, active_member_count, status, settings, features_enabled)
  VALUES
    ('Canadian Union of Public Employees',                           'cupe',     'CUPE',      'CUPE',      'Canada''s largest union — 700,000 members in healthcare, education, and municipalities.',  'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['public_service','healthcare','education']::labour_sector[], 'https://cupe.ca',       true, 700000, 700000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Unifor',                                                       'unifor',   'Unifor',    'Unifor',    'Canada''s largest private-sector union — auto, aerospace, media, telecom.',                 'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['manufacturing','transportation','telecommunications']::labour_sector[], 'https://unifor.org', true, 315000, 315000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('United Food and Commercial Workers Canada',                    'ufcw',     'UFCW',      'UFCW',      'Workers in food processing, retail, hospitality, and agriculture across Canada.',          'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['retail','agriculture','hospitality']::labour_sector[], 'https://ufcw.ca',      true, 250000, 250000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('United Steelworkers',                                          'usw',      'USW',       'USW',       'One of North America''s largest industrial unions — steel, mining, manufacturing.',         'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['manufacturing','trades']::labour_sector[], 'https://usw.ca',           true, 225000, 225000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Public Service Alliance of Canada',                            'psac',     'PSAC',      'PSAC',      'The union of Canada''s federal public service.',                                           'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['public_service']::labour_sector[], 'https://psacunion.ca',         true, 215000, 215000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Canadian Federation of Nurses Unions',                         'cfnu',     'CFNU',      'CFNU',      'National federation representing nurses across all provinces.',                            'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['healthcare']::labour_sector[], 'https://nursesunions.ca',         true, 200000, 200000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Teamsters Canada',                                             'teamsters','Teamsters', 'Teamsters', 'Freight, parcel, airline, rail, and warehouse workers across Canada.',                     'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['transportation','retail']::labour_sector[], 'https://teamsters.ca',    true, 125000, 125000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Service Employees International Union',                        'seiu',     'SEIU',      'SEIU',      'Healthcare, property services, and public-sector workers across Canada.',                  'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['healthcare','public_service']::labour_sector[], 'https://seiulocal2.ca', true, 100000, 100000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('International Brotherhood of Electrical Workers — Canada',     'ibew-ca',  'IBEW',      'IBEW',      'Electricians, lineworkers, and utility technicians.',                                      'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['trades','construction','utilities']::labour_sector[], 'https://ibew.org',   true, 70000,  70000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Canadian Union of Postal Workers',                             'cupw',     'CUPW',      'CUPW',      'Letter carriers, postal clerks, and RSMCs delivering mail coast to coast.',                'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['public_service','transportation']::labour_sector[], 'https://cupw-sttp.org',true, 55000,  55000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('International Association of Machinists and Aerospace Workers','iamaw',    'IAMAW',     'IAMAW',     'Aerospace, airline, rail, and precision-manufacturing workers.',                           'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['manufacturing','transportation']::labour_sector[], 'https://iamaw.ca',    true, 50000,  50000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Alliance of Canadian Cinema, Television and Radio Artists',    'actra',    'ACTRA',     'ACTRA',     'Performers in film, television, radio, and digital media.',                                'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['arts_culture']::labour_sector[], 'https://actra.ca',            true, 28000,  28000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking'])
  ON CONFLICT (slug) DO NOTHING;

  -- Set CAPE parent to CLC if not already set
  UPDATE organizations
  SET parent_id = clc_id, hierarchy_path = ARRAY[clc_id::text], hierarchy_level = 1
  WHERE slug = 'cape-acep' AND parent_id IS NULL;

  -- National union affiliate relationships (idempotent)
  FOR aff_id IN SELECT id FROM organizations WHERE organization_type = 'union' AND parent_id = clc_id
  LOOP
    INSERT INTO organization_relationships (parent_org_id, child_org_id, relationship_type, effective_date, notes)
    SELECT clc_id, aff_id, 'affiliate', CURRENT_DATE, 'National union affiliated to CLC'
    WHERE NOT EXISTS (
      SELECT 1 FROM organization_relationships
      WHERE parent_org_id = clc_id AND child_org_id = aff_id
    );
  END LOOP;

  -- ========== 4. Sample Locals & District Labour Councils ==========
  SELECT id INTO cupe_id   FROM organizations WHERE slug = 'cupe';
  SELECT id INTO unifor_id FROM organizations WHERE slug = 'unifor';
  SELECT id INTO ufcw_id   FROM organizations WHERE slug = 'ufcw';
  SELECT id INTO usw_id    FROM organizations WHERE slug = 'usw';
  SELECT id INTO ofl_id    FROM organizations WHERE slug = 'ofl';
  SELECT id INTO bcfed_id  FROM organizations WHERE slug = 'bcfed';

  -- CUPE locals
  IF cupe_id IS NOT NULL THEN
    INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, clc_affiliated, member_count, active_member_count, status, charter_number, settings, features_enabled)
    VALUES
      ('CUPE Local 79',   'cupe-local-79',   'CUPE 79',   'CUPE 79',   'City of Toronto inside workers — largest CUPE local.', 'local', cupe_id, ARRAY[clc_id::text, cupe_id::text], 2, 'ON', ARRAY['public_service']::labour_sector[], true, 25000, 25000, 'active', 'CUPE-ON-079',   '{"perCapitaRate":0.54}'::jsonb, ARRAY['grievance-management','member-portal','dues-tracking']),
      ('CUPE Local 3903', 'cupe-local-3903', 'CUPE 3903', 'CUPE 3903', 'York University contract faculty and TAs.',            'local', cupe_id, ARRAY[clc_id::text, cupe_id::text], 2, 'ON', ARRAY['education']::labour_sector[],       true, 3800,  3800,  'active', 'CUPE-ON-3903', '{"perCapitaRate":0.54}'::jsonb, ARRAY['grievance-management','member-portal','dues-tracking']),
      ('CUPE Local 1000', 'cupe-local-1000', 'CUPE 1000', 'CUPE 1000', 'Ottawa-Carleton region municipality workers.',         'local', cupe_id, ARRAY[clc_id::text, cupe_id::text], 2, 'ON', ARRAY['public_service']::labour_sector[], true, 4500,  4500,  'active', 'CUPE-ON-1000', '{"perCapitaRate":0.54}'::jsonb, ARRAY['grievance-management','member-portal','dues-tracking'])
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  -- Unifor locals
  IF unifor_id IS NOT NULL THEN
    INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, clc_affiliated, member_count, active_member_count, status, charter_number, settings, features_enabled)
    VALUES
      ('Unifor Local 444',  'unifor-local-444',  'Unifor 444',  'Unifor 444',  'Windsor Stellantis assembly workers.',   'local', unifor_id, ARRAY[clc_id::text, unifor_id::text], 2, 'ON', ARRAY['manufacturing']::labour_sector[], true, 12000, 12000, 'active', 'UNI-ON-444',   '{"perCapitaRate":0.54}'::jsonb, ARRAY['grievance-management','member-portal','dues-tracking']),
      ('Unifor Local 2002', 'unifor-local-2002', 'Unifor 2002', 'Unifor 2002', 'Airline workers — Air Canada, Jazz.',   'local', unifor_id, ARRAY[clc_id::text, unifor_id::text], 2, NULL, ARRAY['transportation']::labour_sector[], true, 7000,  7000,  'active', 'UNI-NAT-2002', '{"perCapitaRate":0.54}'::jsonb, ARRAY['grievance-management','member-portal','dues-tracking'])
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  -- UFCW locals
  IF ufcw_id IS NOT NULL THEN
    INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, clc_affiliated, member_count, active_member_count, status, charter_number, settings, features_enabled)
    VALUES
      ('UFCW Local 401',   'ufcw-local-401',   'UFCW 401',   'UFCW 401',   'Alberta retail, agriculture, hospitality.', 'local', ufcw_id, ARRAY[clc_id::text, ufcw_id::text], 2, 'AB', ARRAY['retail','agriculture']::labour_sector[], true, 32000, 32000, 'active', 'UFCW-AB-401',   '{"perCapitaRate":0.54}'::jsonb, ARRAY['grievance-management','member-portal','dues-tracking']),
      ('UFCW Local 1006A', 'ufcw-local-1006a', 'UFCW 1006A', 'UFCW 1006A', 'Ontario food retail and hospitality.',      'local', ufcw_id, ARRAY[clc_id::text, ufcw_id::text], 2, 'ON', ARRAY['retail','hospitality']::labour_sector[],  true, 35000, 35000, 'active', 'UFCW-ON-1006A', '{"perCapitaRate":0.54}'::jsonb, ARRAY['grievance-management','member-portal','dues-tracking'])
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  -- USW locals
  IF usw_id IS NOT NULL THEN
    INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, clc_affiliated, member_count, active_member_count, status, charter_number, settings, features_enabled)
    VALUES
      ('USW Local 1005', 'usw-local-1005', 'USW 1005', 'USW 1005', 'ArcelorMittal Dofasco steelworkers, Hamilton.', 'local', usw_id, ARRAY[clc_id::text, usw_id::text], 2, 'ON', ARRAY['manufacturing']::labour_sector[],         true, 2200, 2200, 'active', 'USW-ON-1005', '{"perCapitaRate":0.54}'::jsonb, ARRAY['grievance-management','member-portal','dues-tracking']),
      ('USW Local 6500', 'usw-local-6500', 'USW 6500', 'USW 6500', 'Vale nickel mine workers, Sudbury.',           'local', usw_id, ARRAY[clc_id::text, usw_id::text], 2, 'ON', ARRAY['manufacturing','trades']::labour_sector[], true, 4000, 4000, 'active', 'USW-ON-6500', '{"perCapitaRate":0.54}'::jsonb, ARRAY['grievance-management','member-portal','dues-tracking'])
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  -- District Labour Councils
  IF ofl_id IS NOT NULL THEN
    INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, clc_affiliated, member_count, active_member_count, status, settings, features_enabled)
    VALUES ('Toronto & York Region Labour Council', 'tyrlc', 'TYRLC', 'TYRLC', 'Greater Toronto Area and York Region district labour council.', 'district', ofl_id, ARRAY[clc_id::text, ofl_id::text], 2, 'ON', '{}', true, 200000, 200000, 'active', '{}'::jsonb, ARRAY['local-management','federation-reporting'])
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  IF bcfed_id IS NOT NULL THEN
    INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, clc_affiliated, member_count, active_member_count, status, settings, features_enabled)
    VALUES ('Vancouver & District Labour Council', 'vdlc', 'VDLC', 'VDLC', 'Metro Vancouver area district labour council.', 'district', bcfed_id, ARRAY[clc_id::text, bcfed_id::text], 2, 'BC', '{}', true, 120000, 120000, 'active', '{}'::jsonb, ARRAY['local-management','federation-reporting'])
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  RAISE NOTICE 'Hierarchy seeded: CLC id = %', clc_id;
END $$;

-- ============================================================
-- 5. CLC Demo Members (10) — idempotent via NOT EXISTS
-- ============================================================
DO $$
DECLARE
  clc_id UUID;
BEGIN
  SELECT id INTO clc_id FROM organizations WHERE slug = 'clc';

  INSERT INTO organization_members (user_id, organization_id, name, email, role, status, department, position, hire_date)
  SELECT v.user_id, clc_id::text, v.name, v.email, v.role, v.status, v.department, v.position, v.hire_date::timestamptz
  FROM (VALUES
    ('clc-user-001', 'Hassan Yussuff',      'h.yussuff@clc-ctc.ca',   'admin',  'active', 'Executive',       'National President',         '2014-05-01'),
    ('clc-user-002', 'Marie Clarke Walker', 'm.walker@clc-ctc.ca',    'admin',  'active', 'Executive',       'Executive Vice-President',   '2017-06-15'),
    ('clc-user-003', 'Denis Bolduc',        'd.bolduc@clc-ctc.ca',    'member', 'active', 'Policy',          'Secretary-Treasurer',        '2019-09-01'),
    ('clc-user-004', 'Sophie Tremblay',     's.tremblay@clc-ctc.ca',  'member', 'active', 'Legal',           'Director of Legal Affairs',  '2020-01-10'),
    ('clc-user-005', 'James Nguyen',        'j.nguyen@clc-ctc.ca',    'member', 'active', 'Research',        'Senior Research Analyst',    '2018-03-20'),
    ('clc-user-006', 'Rebecca Martin',      'r.martin@clc-ctc.ca',    'member', 'active', 'Communications',  'Media Relations Officer',    '2021-07-01'),
    ('clc-user-007', 'Louis Picard',        'l.picard@clc-ctc.ca',    'member', 'active', 'Policy',          'Policy Advisor',             '2016-11-20'),
    ('clc-user-008', 'Angela Varga',        'a.varga@clc-ctc.ca',     'member', 'active', 'International',   'International Liaison',      '2022-02-14'),
    ('clc-user-009', 'Patrick O''Connor',   'p.oconnor@clc-ctc.ca',   'member', 'active', 'Education',       'Education Coordinator',      '2019-08-05'),
    ('clc-user-010', 'Fatima Al-Rashid',    'f.alrashid@clc-ctc.ca',  'member', 'active', 'Organizing',      'National Organizer',         '2023-01-15')
  ) AS v(user_id, name, email, role, status, department, position, hire_date)
  WHERE NOT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = v.user_id AND om.organization_id = clc_id::text
  );
END $$;

-- ============================================================
-- 6. CAPE-ACEP Demo Members (12)
-- ============================================================
DO $$
DECLARE
  cape_id UUID;
BEGIN
  SELECT id INTO cape_id FROM organizations WHERE slug = 'cape-acep';

  INSERT INTO organization_members (user_id, organization_id, name, email, role, status, department, position, membership_number, union_join_date, seniority)
  SELECT v.user_id, cape_id::text, v.name, v.email, v.role, v.status, v.department, v.position, v.membership_number, v.union_join_date::timestamptz, v.seniority::int
  FROM (VALUES
    ('cape-user-001', 'Greg Phillips',       'g.phillips@acep-cape.ca',  'admin',  'active', 'Executive',           'National President',          'CAPE-2018-001', '2018-04-01', '6'),
    ('cape-user-002', 'Emmanuelle Tremblay', 'e.tremblay@acep-cape.ca',  'admin',  'active', 'Executive',           'Vice-President',              'CAPE-2019-002', '2019-06-01', '5'),
    ('cape-user-003', 'Brian Faulkner',      'b.faulkner@acep-cape.ca',  'member', 'active', 'Bargaining',          'Chief Negotiator',            'CAPE-2015-003', '2015-01-15', '9'),
    ('cape-user-004', 'Chantal Bertrand',    'c.bertrand@acep-cape.ca',  'member', 'active', 'Labour Relations',    'Labour Relations Officer',    'CAPE-2020-004', '2020-03-01', '4'),
    ('cape-user-005', 'Mike Savard',         'm.savard@acep-cape.ca',    'member', 'active', 'Legal',               'Staff Lawyer',                'CAPE-2017-005', '2017-09-15', '7'),
    ('cape-user-006', 'Nadia Ouellet',       'n.ouellet@acep-cape.ca',   'member', 'active', 'Finance',             'Controller',                  'CAPE-2021-006', '2021-01-10', '3'),
    ('cape-user-007', 'Daniel Kim',          'd.kim@acep-cape.ca',       'member', 'active', 'Membership Services', 'Membership Coordinator',      'CAPE-2022-007', '2022-05-01', '2'),
    ('cape-user-008', 'Sarah Lefebvre',      's.lefebvre@acep-cape.ca',  'member', 'active', 'Stewards',            'Chief Steward - NCR',         'CAPE-2016-008', '2016-07-20', '8'),
    ('cape-user-009', 'Alexandre Moreau',    'a.moreau@acep-cape.ca',    'member', 'active', 'Stewards',            'Steward - Pacific Region',    'CAPE-2023-009', '2023-03-01', '1'),
    ('cape-user-010', 'Jennifer Walsh',      'j.walsh@acep-cape.ca',     'member', 'active', 'Communications',      'Digital Communications Lead', 'CAPE-2019-010', '2019-11-01', '5'),
    ('cape-user-011', 'Pierre Desmarais',    'p.desmarais@acep-cape.ca', 'member', 'active', 'Research',            'Senior Economist',            'CAPE-2014-011', '2014-08-01', '10'),
    ('cape-user-012', 'Amira Hassan',        'a.hassan@acep-cape.ca',    'member', 'active', 'IT',                  'Systems Analyst',             'CAPE-2024-012', '2024-01-15', '0')
  ) AS v(user_id, name, email, role, status, department, position, membership_number, union_join_date, seniority)
  WHERE NOT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = v.user_id AND om.organization_id = cape_id::text
  );
END $$;

-- ============================================================
-- 7. Platform admin memberships in CLC
-- ============================================================
DO $$
DECLARE
  clc_id UUID;
BEGIN
  SELECT id INTO clc_id FROM organizations WHERE slug = 'clc';

  INSERT INTO organization_members (user_id, organization_id, name, email, role, status)
  SELECT v.user_id, clc_id::text, v.name, v.email, 'admin', 'active'
  FROM (VALUES
    ('user_35NlrrNcfTv0DMh2kzBHyXZRtpb', 'Platform Admin 1', 'admin+35NlrrNcfT@nzila.io'),
    ('user_37Zo7OrvP4jy0J0MU5APfkDtE2V', 'Platform Admin 2', 'admin+37Zo7OrvP4@nzila.io')
  ) AS v(user_id, name, email)
  WHERE NOT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = v.user_id AND om.organization_id = clc_id::text
  );
END $$;

-- ============================================================
-- 8. CLC Grievances (5 additional to match local count)
-- ============================================================
DO $$
DECLARE
  clc_id UUID;
BEGIN
  SELECT id INTO clc_id FROM organizations WHERE slug = 'clc';

  INSERT INTO grievances (grievance_number, type, status, priority, step, title, description, organization_id, grievant_name, grievant_email, employer_name, workplace_name, incident_date, filed_date, background, desired_outcome)
  SELECT v.grievance_number, v.gtype::grievance_type, v.gstatus::grievance_status, v.gpriority::grievance_priority, v.gstep::grievance_step,
         v.title, v.description, clc_id, v.grievant_name, v.grievant_email, v.employer_name, v.workplace_name,
         v.incident_date::timestamptz, v.filed_date::timestamptz, v.background, v.desired_outcome
  FROM (VALUES
    ('CLC-GRV-2025-001', 'contract', 'filed', 'high', 'step_1',
     'Overtime Pay Calculation Dispute',
     'Employer calculating overtime at 1.0x instead of 1.5x for hours exceeding 40/week.',
     'James Nguyen', 'j.nguyen@clc-ctc.ca', 'Treasury Board of Canada', 'CLC National Office',
     '2025-01-15', '2025-01-20',
     'The employer began applying a new payroll system in December 2024 that miscalculates overtime rates.',
     'Retroactive overtime payments at the correct 1.5x rate for all affected pay periods.'),

    ('CLC-GRV-2025-002', 'harassment', 'investigating', 'urgent', 'step_2',
     'Workplace Harassment - Hostile Environment',
     'Ongoing pattern of intimidation by a supervisor including public belittling and exclusion from meetings.',
     'Rebecca Martin', 'r.martin@clc-ctc.ca', 'Treasury Board of Canada', 'CLC National Office',
     '2024-12-01', '2025-01-05',
     'Multiple incidents since October 2024. Informal resolution attempted and failed.',
     'Formal investigation, supervisor reassignment, and anti-harassment training.'),

    ('CLC-GRV-2025-003', 'discipline', 'escalated', 'high', 'step_3',
     'Unjust Suspension Without Pay',
     'Member suspended for 5 days without pay for alleged insubordination. No prior progressive discipline.',
     'Patrick O''Connor', 'p.oconnor@clc-ctc.ca', 'Treasury Board of Canada', 'CLC National Office',
     '2025-02-10', '2025-02-12',
     'Member questioned a directive believed to violate safety protocols. Employer issued immediate suspension.',
     'Rescind suspension, restore full pay, remove from personnel file.'),

    ('CLC-GRV-2025-004', 'seniority', 'mediation', 'medium', 'step_3',
     'Seniority Bypass in Promotion',
     'Senior qualified member passed over in favour of a less senior candidate.',
     'Louis Picard', 'l.picard@clc-ctc.ca', 'Treasury Board of Canada', 'CLC National Office',
     '2024-11-01', '2024-11-15',
     'Article 21.7 requires seniority consideration. Employer claims management rights override.',
     'Rescind appointment, offer position to senior candidate, or equivalent remedy.'),

    ('CLC-GRV-2025-005', 'safety', 'settled', 'high', 'step_3',
     'Inadequate Ergonomic Support for Remote Workers',
     'Employer failed to provide ergonomic assessments for remote workers as required by the OHS provisions.',
     'Fatima Al-Rashid', 'f.alrashid@clc-ctc.ca', 'Treasury Board of Canada', 'CLC - Remote Workers Unit',
     '2024-11-15', '2024-11-20',
     'Over 30 remote workers reported musculoskeletal issues. Employer stated assessments were optional.',
     'Mandatory ergonomic assessments for all remote workers, equipment reimbursement up to $2,000.')
  ) AS v(grievance_number, gtype, gstatus, gpriority, gstep, title, description, grievant_name, grievant_email, employer_name, workplace_name, incident_date, filed_date, background, desired_outcome)
  WHERE NOT EXISTS (
    SELECT 1 FROM grievances g WHERE g.grievance_number = v.grievance_number
  );
END $$;

-- ============================================================
-- 9. CLC Collective Agreements (2 additional)
-- ============================================================
DO $$
DECLARE
  clc_id UUID;
BEGIN
  SELECT id INTO clc_id FROM organizations WHERE slug = 'clc';

  INSERT INTO collective_agreements (organization_id, cba_number, title, jurisdiction, employer_name, union_name, effective_date, expiry_date, signed_date, industry_sector, status, language, employee_coverage, bargaining_unit_description)
  SELECT clc_id, v.cba_number, v.title, v.jurisdiction::cba_jurisdiction, v.employer_name, v.union_name, v.effective_date::timestamptz, v.expiry_date::timestamptz, v.signed_date::timestamptz, v.industry_sector, v.cba_status::cba_status, v.cba_language::cba_language, v.employee_coverage::int, v.bargaining_unit_description
  FROM (VALUES
    ('CLC-CBA-2023-001',
     'CLC Staff Collective Agreement 2023-2027',
     'federal', 'Treasury Board of Canada', 'Canadian Labour Congress', '2023-06-01', '2027-05-31', '2023-07-15',
     'public_administration', 'active', 'bilingual', '185',
     'All employees of the CLC National Office in the bargaining unit.'),
    ('CLC-CBA-2019-002',
     'CLC Regional Staff Agreement 2019-2023',
     'federal', 'Treasury Board of Canada', 'Canadian Labour Congress', '2019-09-01', '2023-08-31', '2019-10-01',
     'public_administration', 'expired', 'en', '42',
     'Regional office staff including education coordinators, organizers, and support staff.')
  ) AS v(cba_number, title, jurisdiction, employer_name, union_name, effective_date, expiry_date, signed_date, industry_sector, cba_status, cba_language, employee_coverage, bargaining_unit_description)
  WHERE NOT EXISTS (
    SELECT 1 FROM collective_agreements ca WHERE ca.cba_number = v.cba_number
  );
END $$;

COMMIT;
