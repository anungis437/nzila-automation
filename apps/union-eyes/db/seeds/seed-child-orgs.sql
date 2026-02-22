-- Seed child organizations (locals + district labour councils)
-- Run: docker exec -i ue-postgres psql -U nzila -d nzila_union_eyes < seed-child-orgs.sql

INSERT INTO organizations (name, slug, display_name, short_name, description, organization_type, parent_id, hierarchy_path, hierarchy_level, province_territory, sectors, clc_affiliated, member_count, active_member_count, status, charter_number, settings, features_enabled)
VALUES
  -- CUPE Locals
  ('CUPE Local 79', 'cupe-local-79', 'CUPE 79', 'CUPE 79',
   'City of Toronto inside workers — the largest CUPE local in Canada.',
   'local', '9210418f-6a4f-4dab-a7d2-4450d581dc81',
   ARRAY['9210418f-6a4f-4dab-a7d2-4450d581dc81'], 3, 'ON',
   ARRAY['public_service']::labour_sector[], true, 25000, 25000, 'active', 'CUPE-ON-079',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  ('CUPE Local 3903', 'cupe-local-3903', 'CUPE 3903', 'CUPE 3903',
   'York University contract faculty, teaching assistants, and graduate assistants.',
   'local', '9210418f-6a4f-4dab-a7d2-4450d581dc81',
   ARRAY['9210418f-6a4f-4dab-a7d2-4450d581dc81'], 3, 'ON',
   ARRAY['education']::labour_sector[], true, 3800, 3800, 'active', 'CUPE-ON-3903',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  ('CUPE Local 1000', 'cupe-local-1000', 'CUPE 1000', 'CUPE 1000',
   'Regional municipality workers in the Ottawa–Carleton region.',
   'local', '9210418f-6a4f-4dab-a7d2-4450d581dc81',
   ARRAY['9210418f-6a4f-4dab-a7d2-4450d581dc81'], 3, 'ON',
   ARRAY['public_service']::labour_sector[], true, 4500, 4500, 'active', 'CUPE-ON-1000',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  -- Unifor Locals
  ('Unifor Local 444', 'unifor-local-444', 'Unifor 444', 'Unifor 444',
   'Windsor-area Stellantis assembly and manufacturing workers.',
   'local', 'c2cb050c-184d-4c7b-83a4-ddb780129ac9',
   ARRAY['c2cb050c-184d-4c7b-83a4-ddb780129ac9'], 3, 'ON',
   ARRAY['manufacturing']::labour_sector[], true, 12000, 12000, 'active', 'UNI-ON-444',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  ('Unifor Local 2002', 'unifor-local-2002', 'Unifor 2002', 'Unifor 2002',
   'Airline workers — Air Canada, Jazz Aviation, and airport services.',
   'local', 'c2cb050c-184d-4c7b-83a4-ddb780129ac9',
   ARRAY['c2cb050c-184d-4c7b-83a4-ddb780129ac9'], 3, NULL,
   ARRAY['transportation']::labour_sector[], true, 7000, 7000, 'active', 'UNI-NAT-2002',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  -- UFCW Locals
  ('UFCW Local 401', 'ufcw-local-401', 'UFCW 401', 'UFCW 401',
   'Alberta retail, agriculture, and hospitality — Safeway, Sobeys, Cargill.',
   'local', '38becbd3-ea51-4e18-8bae-286d1b0dc921',
   ARRAY['38becbd3-ea51-4e18-8bae-286d1b0dc921'], 3, 'AB',
   ARRAY['retail','agriculture']::labour_sector[], true, 32000, 32000, 'active', 'UFCW-AB-401',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  ('UFCW Local 1006A', 'ufcw-local-1006a', 'UFCW 1006A', 'UFCW 1006A',
   'Ontario food retail and hospitality — Loblaw, Maple Leaf, hotels, gaming.',
   'local', '38becbd3-ea51-4e18-8bae-286d1b0dc921',
   ARRAY['38becbd3-ea51-4e18-8bae-286d1b0dc921'], 3, 'ON',
   ARRAY['retail','hospitality']::labour_sector[], true, 35000, 35000, 'active', 'UFCW-ON-1006A',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  -- USW Locals
  ('USW Local 1005', 'usw-local-1005', 'USW 1005', 'USW 1005',
   'ArcelorMittal Dofasco steelworkers in Hamilton.',
   'local', 'b1b1ca7b-e62e-451b-b344-b63afaadff20',
   ARRAY['b1b1ca7b-e62e-451b-b344-b63afaadff20'], 3, 'ON',
   ARRAY['manufacturing']::labour_sector[], true, 2200, 2200, 'active', 'USW-ON-1005',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  ('USW Local 6500', 'usw-local-6500', 'USW 6500', 'USW 6500',
   'Vale nickel mine and smelter workers in Sudbury.',
   'local', 'b1b1ca7b-e62e-451b-b344-b63afaadff20',
   ARRAY['b1b1ca7b-e62e-451b-b344-b63afaadff20'], 3, 'ON',
   ARRAY['manufacturing','trades']::labour_sector[], true, 4000, 4000, 'active', 'USW-ON-6500',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  -- PSAC Local
  ('PSAC Local 00017', 'psac-local-00017', 'PSAC 00017', 'PSAC 00017',
   'National Capital Region federal public servants — CRA headquarters.',
   'local', '0a67ea05-ac39-4ab8-a660-7d263027473d',
   ARRAY['0a67ea05-ac39-4ab8-a660-7d263027473d'], 3, 'ON',
   ARRAY['public_service']::labour_sector[], true, 1800, 1800, 'active', 'PSAC-ON-00017',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  -- Teamsters Local
  ('Teamsters Local 879', 'teamsters-local-879', 'Teamsters 879', 'Teamsters 879',
   'British Columbia freight, warehousing, and courier workers.',
   'local', '63150673-42c9-412e-8fb4-e6030103f83e',
   ARRAY['63150673-42c9-412e-8fb4-e6030103f83e'], 3, 'BC',
   ARRAY['transportation']::labour_sector[], true, 3500, 3500, 'active', 'TM-BC-879',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  -- IBEW Local
  ('IBEW Local 353', 'ibew-local-353', 'IBEW 353', 'IBEW 353',
   'Greater Toronto Area electricians — construction, maintenance, power systems.',
   'local', 'ca7a7e41-3c0f-4bd8-bc3e-b14920c8af2a',
   ARRAY['ca7a7e41-3c0f-4bd8-bc3e-b14920c8af2a'], 3, 'ON',
   ARRAY['trades','construction']::labour_sector[], true, 10000, 10000, 'active', 'IBEW-ON-353',
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  -- District Labour Councils
  ('Toronto & York Region Labour Council', 'tyrlc', 'TYRLC', 'TYRLC',
   'CLC-chartered labour council for Toronto and York Region — largest in Canada.',
   'district', '16ca5a69-aea0-4e2b-afcf-8d15dbfb55ca',
   ARRAY['16ca5a69-aea0-4e2b-afcf-8d15dbfb55ca'], 2, 'ON',
   ARRAY[]::labour_sector[], true, 200000, 200000, 'active', NULL,
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking']),

  ('Vancouver & District Labour Council', 'vdlc', 'VDLC', 'VDLC',
   'CLC-chartered labour council for Metro Vancouver and surrounding districts.',
   'district', 'b047e687-a6e6-46d6-aa2b-bce103efd94d',
   ARRAY['b047e687-a6e6-46d6-aa2b-bce103efd94d'], 2, 'BC',
   ARRAY[]::labour_sector[], true, 120000, 120000, 'active', NULL,
   '{"perCapitaRate":0.54,"remittanceDay":15}',
   ARRAY['grievance-management','member-portal','dues-tracking'])

ON CONFLICT (slug) DO NOTHING;

-- Now insert relationship records
INSERT INTO organization_relationships (parent_org_id, child_org_id, relationship_type, effective_date, notes)
SELECT p.id, c.id, 'affiliate', CURRENT_DATE, c.short_name || ' under ' || p.slug
FROM organizations c
JOIN organizations p ON c.parent_id = p.id
WHERE c.slug IN (
  'cupe-local-79','cupe-local-3903','cupe-local-1000',
  'unifor-local-444','unifor-local-2002',
  'ufcw-local-401','ufcw-local-1006a',
  'usw-local-1005','usw-local-6500',
  'psac-local-00017','teamsters-local-879','ibew-local-353',
  'tyrlc','vdlc'
)
ON CONFLICT DO NOTHING;
