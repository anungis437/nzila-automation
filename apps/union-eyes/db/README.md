# Database Structure - UnionEyes

## Overview

UnionEyes uses a **Drizzle-first** database architecture with PostgreSQL/Azure SQL backend.

## Directory Structure

```
db/                          # 🎯 Source of Truth
├── schema/                  # TypeScript Drizzle schemas
│   ├── index.ts            # Central schema exports
│   ├── analytics.ts         # Analytics & reporting schema
│   ├── users-schema.ts     # User management
│   ├── claims-schema.ts    # Claims system
│   ├── strike-fund-tax-schema.ts  # Tax compliance
│   └── ... (50+ schema files)
├── seeds/                   # Seed data scripts
│   └── clc-chart-of-accounts.sql
├── migrations/              # Drizzle-generated migrations (if any)
├── db.ts                    # Database client & connection
├── index.ts                 # Schema re-exports
└── schema-organizations.ts  # Organization hierarchy

database/                    # Historical Archive
└── migrations-archive-raw-sql/  # 70+ archived SQL migrations
    ├── archive-obsolete/    # Obsolete migration versions
    └── ... (historical migrations)
```

## Import Patterns

### ✅ Correct (Use These)

```typescript
// Import database client
import { db } from '@/db';

// Import SQL helper from db (also exports drizzle-orm sql)
import { sql } from '@/db';

// Import both
import { db, sql } from '@/db';

// Import schemas
import * as schema from '@/db/schema';
import { users, claims } from '@/db/schema';
```

### ⚠️ Deprecated (Being Phased Out)

```typescript
// Old re-export pattern - still works but avoid in new code
import { db } from '@/lib/db';
import { sql } from '@/lib/db';
```

### ❌ Incorrect (Do Not Use)

```typescript
// Wrong - database directory is archived
import { schema } from '@/database/schema';

// Wrong - redundant path
import { db } from '@/db/db';
```

## Database Client

The database client is defined in `db/db.ts` and provides:

- **PostgreSQL connection** via `postgres` driver
- **Drizzle ORM** instance
- **Multi-database support** (PostgreSQL + Azure SQL Server)
- **Connection pooling** and error handling

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

## Schema Management

### Adding New Tables

1. Create schema file in `db/schema/`:

   ```typescript
   // db/schema/my-feature-schema.ts
   import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
   
   export const myTable = pgTable("my_table", {
     id: uuid("id").primaryKey().defaultRandom(),
     name: text("name").notNull(),
     createdAt: timestamp("created_at").notNull().defaultNow(),
   });
   ```

2. Export from `db/schema/index.ts`:

   ```typescript
   export * from "./my-feature-schema";
   ```

3. Generate migration:

   ```bash
   pnpm db:generate
   ```

4. Apply migration:

   ```bash
   pnpm db:migrate
   ```

### Schema Organization

Schemas are organized by feature/domain:

- **User Management**: `users-schema.ts`, `profiles-schema.ts`
- **Claims**: `claims-schema.ts`, `grievance-workflow-schema.ts`
- **Compliance**: `strike-fund-tax-schema.ts`, `provincial-privacy-schema.ts`
- **Communication**: `messages-schema.ts`, `sms-communications-schema.ts`
- **Analytics**: `analytics.ts`

## Migrations

### Current Approach (Drizzle Kit)

UnionEyes uses **Drizzle Kit** for type-safe schema migrations:

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (dev only)
pnpm db:push
```

### Historical Migrations (Archived)

The `database/migrations-archive-raw-sql/` directory contains 70+ raw SQL migrations from earlier development phases. These are **archived for reference only** and should not be modified or re-run.

## Seeds

Seed data files are in `db/seeds/`:

```bash
# Run seeds (if seed script exists)
psql $DATABASE_URL < db/seeds/clc-chart-of-accounts.sql
```

## Environment Variables

Required database configuration:

```env
# PostgreSQL/Azure SQL connection
DATABASE_URL=postgresql://user:password@host:port/database

# Optional: Azure SQL Server
AZURE_SQL_CONNECTION_STRING=...

# Optional: Read replica
DATABASE_READ_URL=...
```

## Best Practices

### 1. Always Use Drizzle Schemas

❌ Don't write raw SQL for table definitions  
✅ Define tables in TypeScript using Drizzle ORM

### 2. Import from @/db

❌ `import { db } from '@/lib/db'`  
✅ `import { db } from '@/db'`

### 3. Use Typed Queries

```typescript
// ✅ Type-safe Drizzle query
const users = await db.query.users.findMany({
  where: eq(users.tenantId, tenantId)
});

// ⚠️ Raw SQL (use only when necessary)
const result = await db.execute(sql`SELECT * FROM users`);
```

### 4. Handle Errors Properly

```typescript
// ❌ Silent error swallowing
const user = await db.query.users.findFirst(...).catch(() => null);

// ✅ Proper error handling
try {
  const user = await db.query.users.findFirst(...);
  if (!user) {
    throw new Error('User not found');
  }
} catch (error) {
  logger.error('Database error', { error, context: 'getUserById' });
  throw error;
}
```

### 5. Use Transactions for Multi-Step Operations

```typescript
await db.transaction(async (tx) => {
  await tx.insert(users).values(userData);
  await tx.insert(profiles).values(profileData);
});
```

## Troubleshooting

### Connection Issues

```typescript
// Check DATABASE_URL is set
console.log('DB URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');

// Test connection
import { db } from '@/db';
await db.execute(sql`SELECT 1`);
```

### Migration Issues

```bash
# Check current migration status
pnpm drizzle-kit check

# Rollback last migration (manual)
# Edit database/migrations-archive-raw-sql/ as needed
```

### Schema Sync Issues

```bash
# Generate new migration from schema
pnpm db:generate

# Preview migration
cat db/migrations/[timestamp]_migration.sql

# Apply it
pnpm db:migrate
```

## Related Documentation

- [Production Readiness Checklist](PRODUCTION_READINESS.md) - Database validation steps
- [Database Consolidation Guide](DATABASE_CONSOLIDATION.md) - Migration history
- [Security Guidelines](../SECURITY_WORLD_CLASS_COMPLETE.md) - Database security

## Support

For database-related issues:

- Check error logs in `latest-logs/`
- Review Drizzle documentation: <https://orm.drizzle.team>
- Contact: [Database admin contact]

---

**Last Updated:** February 6, 2026  
**Schema Version:** See `db/schema/index.ts`  
**Migration Count:** 70+ archived, fresh Drizzle setup
