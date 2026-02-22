-- Install required PostgreSQL extensions for UnionEyes
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Verify installations
SELECT extname, extversion FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pg_trgm', 'btree_gin', 'pgcrypto')
ORDER BY extname;
