-- ============================================================================
-- Migration 0068: Add Indexes for Peer Detection
-- Improves performance for smart onboarding peer detection queries
-- ============================================================================

-- Index for sector filtering with array overlap operator
CREATE INDEX IF NOT EXISTS idx_organizations_sectors_gin 
ON organizations USING GIN (sectors);

-- Index for member count range queries
CREATE INDEX IF NOT EXISTS idx_organizations_member_count 
ON organizations (member_count) 
WHERE member_count IS NOT NULL AND status = 'active';

-- Index for province/sector combination queries
CREATE INDEX IF NOT EXISTS idx_organizations_province_sector 
ON organizations (province_territory, organization_type) 
WHERE status = 'active';

-- Index for CLC affiliation queries
CREATE INDEX IF NOT EXISTS idx_organizations_clc_affiliated 
ON organizations (clc_affiliated, organization_type) 
WHERE clc_affiliated = true AND status = 'active';

-- Index for shared clause library sector/province queries
CREATE INDEX IF NOT EXISTS idx_shared_clauses_sector_province 
ON shared_clause_library (sector, province, sharing_level)
WHERE sharing_level IN ('public', 'federation', 'congress');

-- Index for shared clause library source organization
CREATE INDEX IF NOT EXISTS idx_shared_clauses_source_org 
ON shared_clause_library (source_organization_id, sharing_level, created_at DESC);

-- Composite index for peer detection by size category
CREATE INDEX IF NOT EXISTS idx_organizations_peer_detection 
ON organizations (organization_type, province_territory, member_count) 
WHERE status = 'active' AND member_count IS NOT NULL;

-- Comment on migration
COMMENT ON INDEX idx_organizations_sectors_gin IS 
'GIN index for efficient array overlap queries in peer detection (finds orgs with matching sectors)';

COMMENT ON INDEX idx_organizations_member_count IS 
'B-tree index for member count range queries in peer size matching';

COMMENT ON INDEX idx_organizations_province_sector IS 
'Composite index for province + organization type filtering';

COMMENT ON INDEX idx_organizations_peer_detection IS 
'Composite index optimized for peer organization discovery queries combining type, province, and size';
