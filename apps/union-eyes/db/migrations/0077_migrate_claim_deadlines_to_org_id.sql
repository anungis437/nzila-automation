-- Migrate claim_deadlines table from tenant_id to organization_id
-- This aligns the table with the organizational hierarchy structure

BEGIN;

-- 1. Drop old RLS policies (required before altering columns)
DROP POLICY IF EXISTS claim_deadlines_select_policy ON claim_deadlines;
DROP POLICY IF EXISTS claim_deadlines_insert_policy ON claim_deadlines;
DROP POLICY IF EXISTS claim_deadlines_update_policy ON claim_deadlines;
DROP POLICY IF EXISTS claim_deadlines_delete_policy ON claim_deadlines;

-- 2. Check if the column exists
DO $$ 
BEGIN
    -- Rename tenant_id to organization_id if tenant_id exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claim_deadlines' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE claim_deadlines 
        RENAME COLUMN tenant_id TO organization_id;
        
        RAISE NOTICE 'Renamed tenant_id to organization_id';
    END IF;
    
    -- Ensure the column is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claim_deadlines' 
        AND column_name = 'organization_id'
        AND data_type != 'uuid'
    ) THEN
        ALTER TABLE claim_deadlines 
        ALTER COLUMN organization_id TYPE UUID USING organization_id::UUID;
        
        RAISE NOTICE 'Updated organization_id to UUID type';
    END IF;
END $$;

-- 3. Create new RLS policies using organization_id
CREATE POLICY claim_deadlines_select_policy ON claim_deadlines
  FOR SELECT
  USING (
    organization_id IN (
      SELECT * FROM get_descendant_org_ids(
        (SELECT organization_id FROM organization_members 
         WHERE user_id = current_setting('app.current_user_id', TRUE)::VARCHAR 
         LIMIT 1)
      )
    )
  );

CREATE POLICY claim_deadlines_insert_policy ON claim_deadlines
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', TRUE)::VARCHAR
    )
  );

CREATE POLICY claim_deadlines_update_policy ON claim_deadlines
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT * FROM get_descendant_org_ids(
        (SELECT organization_id FROM organization_members 
         WHERE user_id = current_setting('app.current_user_id', TRUE)::VARCHAR 
         LIMIT 1)
      )
    )
  );

CREATE POLICY claim_deadlines_delete_policy ON claim_deadlines
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.user_id = current_setting('app.current_user_id', TRUE)::VARCHAR
        AND om.organization_id = claim_deadlines.organization_id
        AND om.role = 'admin'
        AND om.status = 'active'
    )
  );

COMMIT;
