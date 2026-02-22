-- ============================================================================
-- Migration 0062: Wage Benchmarks Tables Only
-- External Data Integration: Statistics Canada wage and union density data
-- Clean migration: Only creates wage_benchmarks tables (no duplicate enums)
-- ============================================================================

-- ============================================================================
-- 1. contribution_rates - Employer contribution benchmarks
-- ============================================================================
CREATE TABLE IF NOT EXISTS contribution_rates (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	rate_type varchar(50) NOT NULL,
	rate_type_name varchar(100),
	rate numeric(5, 4) NOT NULL,
	max_insurable_earnings numeric(12, 2),
	exemption_limit numeric(12, 2),
	maximum_contribution numeric(12, 2),
	year integer NOT NULL,
	effective_date varchar(20),
	source varchar(100) DEFAULT 'Canada Revenue Agency' NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	sync_id varchar(100)
);

-- ============================================================================
-- 2. cost_of_living_data - CPI and inflation data by region
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_of_living_data (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	geography_code varchar(10) NOT NULL,
	geography_name varchar(255) NOT NULL,
	cpi_value numeric(10, 2) NOT NULL,
	cpi_vector varchar(50),
	inflation_rate numeric(5, 2) NOT NULL,
	year integer NOT NULL,
	ref_date varchar(20) NOT NULL,
	source varchar(100) DEFAULT 'Statistics Canada' NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	sync_id varchar(100)
);

-- ============================================================================
-- 3. external_data_sync_log - Tracks API sync operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS external_data_sync_log (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	source varchar(100) NOT NULL,
	source_type varchar(50) NOT NULL,
	sync_id varchar(100) NOT NULL,
	started_at timestamp with time zone DEFAULT now() NOT NULL,
	completed_at timestamp with time zone,
	status varchar(20) DEFAULT 'running' NOT NULL,
	records_processed integer DEFAULT 0,
	records_inserted integer DEFAULT 0,
	records_updated integer DEFAULT 0,
	records_failed integer DEFAULT 0,
	error_message text,
	error_details text,
	initiated_by varchar(100),
	sync_type varchar(50) DEFAULT 'manual' NOT NULL,
	parameters text,
	CONSTRAINT external_data_sync_log_sync_id_unique UNIQUE(sync_id)
);

-- ============================================================================
-- 4. union_density - Union membership by sector/region
-- ============================================================================
CREATE TABLE IF NOT EXISTS union_density (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	geography_code varchar(10) NOT NULL,
	geography_name varchar(255) NOT NULL,
	naics_code varchar(10),
	naics_name varchar(255),
	noc_code varchar(10),
	noc_name varchar(255),
	sex varchar(1) DEFAULT 'B' NOT NULL,
	age_group varchar(50),
	age_group_name varchar(100),
	citizenship varchar(50),
	citizenship_name varchar(100),
	union_status varchar(50) NOT NULL,
	union_status_name varchar(100) NOT NULL,
	density_value numeric(5, 2) NOT NULL,
	ref_date varchar(20) NOT NULL,
	survey_year integer NOT NULL,
	source varchar(100) DEFAULT 'Statistics Canada' NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	sync_id varchar(100)
);

-- ============================================================================
-- 5. wage_benchmarks - Statistics Canada wage data by occupation
-- ============================================================================
CREATE TABLE IF NOT EXISTS wage_benchmarks (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	noc_code varchar(10) NOT NULL,
	noc_name varchar(255) NOT NULL,
	noc_category varchar(100),
	geography_code varchar(10) NOT NULL,
	geography_name varchar(255) NOT NULL,
	geography_type varchar(20) DEFAULT 'national' NOT NULL,
	naics_code varchar(10),
	naics_name varchar(255),
	wage_value numeric(12, 2) NOT NULL,
	wage_unit varchar(20) DEFAULT 'hourly' NOT NULL,
	wage_type varchar(50) NOT NULL,
	sex varchar(1) DEFAULT 'B' NOT NULL,
	age_group varchar(50),
	age_group_name varchar(100),
	education_level varchar(50),
	statistics_type varchar(100),
	data_type varchar(100),
	ref_date varchar(20) NOT NULL,
	survey_year integer NOT NULL,
	source varchar(100) DEFAULT 'Statistics Canada' NOT NULL,
	data_quality_symbol varchar(10),
	is_terminated boolean DEFAULT false,
	decimals integer DEFAULT 2,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	sync_id varchar(100)
);

-- ============================================================================
-- Indexes for Query Performance
-- ============================================================================

-- contribution_rates indexes
CREATE INDEX IF NOT EXISTS idx_contribution_rates_type ON contribution_rates(rate_type);
CREATE INDEX IF NOT EXISTS idx_contribution_rates_year ON contribution_rates(year);

-- cost_of_living_data indexes
CREATE INDEX IF NOT EXISTS idx_col_data_geo ON cost_of_living_data(geography_code);
CREATE INDEX IF NOT EXISTS idx_col_data_year ON cost_of_living_data(year);

-- external_data_sync_log indexes
CREATE INDEX IF NOT EXISTS idx_sync_log_source ON external_data_sync_log(source);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON external_data_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_started ON external_data_sync_log(started_at);

-- union_density indexes
CREATE INDEX IF NOT EXISTS idx_union_density_noc ON union_density(noc_code);
CREATE INDEX IF NOT EXISTS idx_union_density_naics ON union_density(naics_code);
CREATE INDEX IF NOT EXISTS idx_union_density_geo ON union_density(geography_code);
CREATE INDEX IF NOT EXISTS idx_union_density_ref ON union_density(ref_date);

-- wage_benchmarks indexes
CREATE INDEX IF NOT EXISTS idx_wage_benchmarks_noc ON wage_benchmarks(noc_code);
CREATE INDEX IF NOT EXISTS idx_wage_benchmarks_geography ON wage_benchmarks(geography_code);
CREATE INDEX IF NOT EXISTS idx_wage_benchmarks_noc_geo ON wage_benchmarks(noc_code, geography_code);
CREATE INDEX IF NOT EXISTS idx_wage_benchmarks_ref_date ON wage_benchmarks(ref_date);
CREATE INDEX IF NOT EXISTS idx_wage_benchmarks_sync ON wage_benchmarks(sync_id);
CREATE INDEX IF NOT EXISTS idx_wage_benchmarks_composite ON wage_benchmarks(noc_code, geography_code, sex, ref_date);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE wage_benchmarks IS 'Statistics Canada wage data by occupation (NOC codes), geography, and demographics - used for CBA negotiations and pay equity analysis';

COMMENT ON TABLE union_density IS 'Union membership rates by sector, region, and demographics from Statistics Canada Labour Force Survey';

COMMENT ON TABLE cost_of_living_data IS 'Consumer Price Index (CPI) and inflation rates by province/region - used for COLA calculations';

COMMENT ON TABLE contribution_rates IS 'Employer contribution rates (EI, CPP, etc.) from Canada Revenue Agency - used for benefits costing';

COMMENT ON TABLE external_data_sync_log IS 'Audit trail of external data API synchronizations with Statistics Canada, CLC, and LRB systems';

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
DECLARE
    wb_exists BOOLEAN;
    ud_exists BOOLEAN;
    col_exists BOOLEAN;
    cr_exists BOOLEAN;
    sync_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'wage_benchmarks') INTO wb_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'union_density') INTO ud_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cost_of_living_data') INTO col_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contribution_rates') INTO cr_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'external_data_sync_log') INTO sync_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'MIGRATION 0062 - WAGE BENCHMARKS';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'wage_benchmarks:          %', CASE WHEN wb_exists THEN '✓ CREATED' ELSE '✗ FAILED' END;
    RAISE NOTICE 'union_density:            %', CASE WHEN ud_exists THEN '✓ CREATED' ELSE '✗ FAILED' END;
    RAISE NOTICE 'cost_of_living_data:      %', CASE WHEN col_exists THEN '✓ CREATED' ELSE '✗ FAILED' END;
    RAISE NOTICE 'contribution_rates:       %', CASE WHEN cr_exists THEN '✓ CREATED' ELSE '✗ FAILED' END;
    RAISE NOTICE 'external_data_sync_log:   %', CASE WHEN sync_exists THEN '✓ CREATED' ELSE '✗ FAILED' END;
    RAISE NOTICE '=============================================================================';
END $$;
