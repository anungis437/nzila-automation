-- Check for orphaned user references across all tables

DO $$
DECLARE
  tbl RECORD;
  orphan_count INT;
  total_orphans INT := 0;
BEGIN
  RAISE NOTICE 'Checking for orphaned user references...';
  RAISE NOTICE '';
  
  FOR tbl IN 
    SELECT DISTINCT table_name, column_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND column_name IN ('user_id', 'created_by', 'updated_by', 'assigned_to')
      AND data_type = 'character varying'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I IS NOT NULL AND %I::text NOT IN (SELECT user_id FROM user_management.users)', 
      tbl.table_name, tbl.column_name, tbl.column_name) INTO orphan_count;
    
    IF orphan_count > 0 THEN
      RAISE NOTICE 'Table: % - Column: % - Orphaned: %', tbl.table_name, tbl.column_name, orphan_count;
      total_orphans := total_orphans + orphan_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Total orphaned references: %', total_orphans;
END $$;
