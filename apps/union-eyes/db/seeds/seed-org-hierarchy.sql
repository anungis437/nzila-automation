-- Seed: CLC Organizational Hierarchy
-- Mirrors db/seeds/seed-org-hierarchy.ts
-- Idempotent: ON CONFLICT (slug) DO NOTHING

BEGIN;

-- 1. CLC Root ──────────────────────────────────────────
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

-- Capture CLC id for foreign keys
DO $$
DECLARE
  clc_id UUID;
  fed_id UUID;
  aff_id UUID;
BEGIN
  SELECT id INTO clc_id FROM organizations WHERE slug = 'clc';
  IF clc_id IS NULL THEN
    RAISE EXCEPTION 'CLC organization not found after insert';
  END IF;

  -- 2. Provincial / Territorial Federations (13) ──────────
  INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, clc_affiliated, member_count, active_member_count, status, settings, features_enabled)
  VALUES
    ('Alberta Federation of Labour',                   'afl',   'AFL',    'AFL',    'Alberta Federation of Labour — Provincial federation of labour for AB.',   'federation', clc_id, ARRAY[clc_id::text], 1, 'AB', '{}', true, 175000, 175000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('BC Federation of Labour',                        'bcfed', 'BCFED',  'BCFED',  'BC Federation of Labour — Provincial federation of labour for BC.',        'federation', clc_id, ARRAY[clc_id::text], 1, 'BC', '{}', true, 500000, 500000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Manitoba Federation of Labour',                  'mfl',   'MFL',    'MFL',    'Manitoba Federation of Labour — Provincial federation of labour for MB.',  'federation', clc_id, ARRAY[clc_id::text], 1, 'MB', '{}', true, 100000, 100000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('New Brunswick Federation of Labour',             'nbfl',  'NBFL',   'NBFL',   'New Brunswick Federation of Labour — Provincial federation for NB.',       'federation', clc_id, ARRAY[clc_id::text], 1, 'NB', '{}', true, 40000,  40000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Newfoundland and Labrador Federation of Labour', 'nlfl',  'NLFL',   'NLFL',   'NL Federation of Labour — Provincial federation of labour for NL.',        'federation', clc_id, ARRAY[clc_id::text], 1, 'NL', '{}', true, 65000,  65000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Nova Scotia Federation of Labour',               'nsfl',  'NSFL',   'NSFL',   'Nova Scotia Federation of Labour — Provincial federation for NS.',         'federation', clc_id, ARRAY[clc_id::text], 1, 'NS', '{}', true, 75000,  75000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Northwest Territories Federation of Labour',     'nwtfl', 'NWTFL',  'NWTFL',  'NWT Federation of Labour — Territorial federation for NT.',                'federation', clc_id, ARRAY[clc_id::text], 1, 'NT', '{}', true, 5000,   5000,   'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Nunavut Employees Union',                        'nueu',  'NUEU',   'NUEU',   'Nunavut Employees Union — Territorial federation for NU.',                 'federation', clc_id, ARRAY[clc_id::text], 1, 'NU', '{}', true, 3000,   3000,   'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Ontario Federation of Labour',                   'ofl',   'OFL',    'OFL',    'Ontario Federation of Labour — Provincial federation for ON.',             'federation', clc_id, ARRAY[clc_id::text], 1, 'ON', '{}', true, 1000000,1000000,'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('PEI Federation of Labour',                       'peifl', 'PEIFL',  'PEIFL',  'PEI Federation of Labour — Provincial federation for PE.',                'federation', clc_id, ARRAY[clc_id::text], 1, 'PE', '{}', true, 12000,  12000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Fédération des travailleurs et travailleuses du Québec', 'ftq', 'FTQ', 'FTQ', 'FTQ — Provincial federation of labour for QC.',                          'federation', clc_id, ARRAY[clc_id::text], 1, 'QC', '{}', true, 600000, 600000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Saskatchewan Federation of Labour',              'sfl',   'SFL',    'SFL',    'Saskatchewan Federation of Labour — Provincial federation for SK.',        'federation', clc_id, ARRAY[clc_id::text], 1, 'SK', '{}', true, 100000, 100000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging']),
    ('Yukon Federation of Labour',                     'yfl',   'YFL',    'YFL',    'Yukon Federation of Labour — Territorial federation for YT.',              'federation', clc_id, ARRAY[clc_id::text], 1, 'YT', '{}', true, 4000,   4000,   'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['local-management','federation-reporting','shared-clause-library','inter-union-messaging'])
  ON CONFLICT (slug) DO NOTHING;

  -- Create federation relationships
  FOR fed_id IN SELECT id FROM organizations WHERE organization_type = 'federation' AND parent_id = clc_id
  LOOP
    INSERT INTO organization_relationships (parent_org_id, child_org_id, relationship_type, effective_date, notes)
    VALUES (clc_id, fed_id, 'affiliate', CURRENT_DATE, 'Provincial/territorial federation affiliated to CLC')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- 3. National / International Union Affiliates (12) ──────
  INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, website, clc_affiliated, member_count, active_member_count, status, settings, features_enabled)
  VALUES
    ('Canadian Union of Public Employees',                  'cupe',     'CUPE',      'CUPE',      'Canada''s largest union — 700,000 members in healthcare, education, municipalities, libraries, utilities, and more.',  'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['public_service','healthcare','education']::labour_sector[],       'https://cupe.ca',       true, 700000, 700000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Unifor',                                              'unifor',   'Unifor',    'Unifor',    'Canada''s largest private-sector union — auto, aerospace, media, telecom, transportation, and more.',                 'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['manufacturing','transportation','telecommunications']::labour_sector[], 'https://unifor.org',  true, 315000, 315000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('United Food and Commercial Workers Canada',           'ufcw',     'UFCW',      'UFCW',      'Representing workers in food processing, retail, hospitality, and agriculture across Canada.',                        'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['retail','agriculture','hospitality']::labour_sector[],              'https://ufcw.ca',     true, 250000, 250000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('United Steelworkers',                                 'usw',      'USW',       'USW',       'One of North America''s largest industrial unions — steel, mining, forestry, energy, and manufacturing.',              'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['manufacturing','trades']::labour_sector[],                         'https://usw.ca',      true, 225000, 225000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Public Service Alliance of Canada',                   'psac',     'PSAC',      'PSAC',      'The union of Canada''s federal public service — CRA, CBSA, Parks Canada, Indigenous Services, and more.',             'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['public_service']::labour_sector[],                                  'https://psacunion.ca',true, 215000, 215000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Canadian Federation of Nurses Unions',                'cfnu',     'CFNU',      'CFNU',      'National federation representing nurses across all provinces and territories.',                                        'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['healthcare']::labour_sector[],                                      'https://nursesunions.ca',true,200000,200000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Teamsters Canada',                                    'teamsters','Teamsters', 'Teamsters', 'Freight, parcel, airline, rail, brewery, and warehouse workers across Canada.',                                        'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['transportation','retail']::labour_sector[],                        'https://teamsters.ca',true, 125000, 125000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Service Employees International Union',               'seiu',     'SEIU',      'SEIU',      'Healthcare, property services, and public-sector workers across Canada.',                                              'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['healthcare','public_service']::labour_sector[],                    'https://seiulocal2.ca',true,100000,100000, 'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('International Brotherhood of Electrical Workers — Canada','ibew-ca','IBEW',    'IBEW',      'Electricians, lineworkers, and utility technicians in construction and maintenance.',                                   'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['trades','construction','utilities']::labour_sector[],              'https://ibew.org',    true, 70000,  70000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Canadian Union of Postal Workers',                    'cupw',     'CUPW',      'CUPW',      'Letter carriers, postal clerks, and RSMCs delivering mail from coast to coast.',                                       'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['public_service','transportation']::labour_sector[],               'https://cupw-sttp.org',true,55000, 55000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('International Association of Machinists and Aerospace Workers','iamaw','IAMAW','IAMAW',     'Aerospace, airline, rail, and precision-manufacturing workers in Canada.',                                             'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['manufacturing','transportation']::labour_sector[],                'https://iamaw.ca',    true, 50000,  50000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking']),
    ('Alliance of Canadian Cinema, Television and Radio Artists','actra','ACTRA',    'ACTRA',     'Performers in film, television, radio, and digital media across Canada.',                                              'union', clc_id, ARRAY[clc_id::text], 1, NULL, ARRAY['arts_culture']::labour_sector[],                                  'https://actra.ca',    true, 28000,  28000,  'active', '{"perCapitaRate":0.54,"remittanceDay":15}'::jsonb, ARRAY['grievance-management','member-portal','contract-management','dues-tracking'])
  ON CONFLICT (slug) DO NOTHING;

  -- Create affiliate relationships for national unions
  FOR aff_id IN SELECT id FROM organizations WHERE organization_type = 'union' AND parent_id = clc_id
  LOOP
    INSERT INTO organization_relationships (parent_org_id, child_org_id, relationship_type, effective_date, notes)
    VALUES (clc_id, aff_id, 'affiliate', CURRENT_DATE, 'National union affiliated to CLC')
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'CLC hierarchy seeded: CLC id = %', clc_id;
END $$;

COMMIT;
