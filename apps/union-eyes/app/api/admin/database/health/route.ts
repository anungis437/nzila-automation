/**
 * GET /api/admin/database/health
 * Returns database health metrics: size, connection count, table stats.
 */
import { db } from '@/db/db';
import { sql } from 'drizzle-orm';
import { withApi } from '@/lib/api/framework';

export const dynamic = 'force-dynamic';

export const GET = withApi(
  { auth: { required: true, minRole: 'platform_lead' } },
  async () => {
    const sizeResult = await db.execute(
      sql`SELECT pg_database_size(current_database()) as db_size`
    );
    const sizeRows = Array.from(sizeResult);
    const dbSizeBytes = Number((sizeRows[0] as Record<string, unknown>)?.db_size ?? 0);

    const connResult = await db.execute(
      sql`SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'`
    );
    const connRows = Array.from(connResult);
    const activeConnections = Number((connRows[0] as Record<string, unknown>)?.active_connections ?? 0);

    const tableResult = await db.execute(
      sql`SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const tableRows = Array.from(tableResult);
    const tableCount = Number((tableRows[0] as Record<string, unknown>)?.table_count ?? 0);

    return {
      success: true,
      dbSizeBytes,
      dbSizeMb: Number((dbSizeBytes / (1024 * 1024)).toFixed(2)),
      activeConnections,
      tableCount,
      status: 'healthy',
      checkedAt: new Date().toISOString(),
    };
  },
);

