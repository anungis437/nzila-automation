# Workday HRIS Integration - Usage Guide

## Overview
The Workday adapter provides seamless integration with Workday HRIS for syncing employee, position, and department data.

## Setup

### 1. Environment Configuration

Add your Workday credentials to `.env`:

```env
WORKDAY_CLIENT_ID=your_client_id_here
WORKDAY_CLIENT_SECRET=your_client_secret_here
WORKDAY_TENANT_ID=your_tenant_id_here
WORKDAY_ENVIRONMENT=production  # or 'sandbox'
```

### 2. Database Configuration

Create an integration configuration record:

```typescript
import { db } from '@/db';
import { integrationConfigs } from '@/db/schema';
import { IntegrationType, IntegrationProvider } from '@/lib/integrations';

await db.insert(integrationConfigs).values({
  organizationId: 'your-org-id',
  type: IntegrationType.HRIS,
  provider: IntegrationProvider.WORKDAY,
  credentials: {
    clientId: process.env.WORKDAY_CLIENT_ID,
    clientSecret: process.env.WORKDAY_CLIENT_SECRET,
    refreshToken: null, // Optional: for OAuth refresh
  },
  settings: {
    tenantId: process.env.WORKDAY_TENANT_ID,
    environment: process.env.WORKDAY_ENVIRONMENT || 'production',
  },
  enabled: true,
  webhookUrl: null, // Workday doesn't support webhooks
});
```

## Usage Examples

### Full Sync

Sync all employees, positions, and departments:

```typescript
import { executeFullSync, IntegrationProvider } from '@/lib/integrations';

const result = await executeFullSync(
  'your-org-id',
  IntegrationProvider.WORKDAY,
  ['employees', 'positions', 'departments']
);

console.log(`Processed: ${result.recordsProcessed}`);
console.log(`Created: ${result.recordsCreated}`);
console.log(`Updated: ${result.recordsUpdated}`);
console.log(`Failed: ${result.recordsFailed}`);
console.log(`Duration: ${result.duration}ms`);
```

### Incremental Sync

Sync only changes since last sync (uses cursors):

```typescript
import { executeIncrementalSync, IntegrationProvider } from '@/lib/integrations';

const result = await executeIncrementalSync(
  'your-org-id',
  IntegrationProvider.WORKDAY,
  ['employees']
);

if (result.success) {
  console.log(`Synced ${result.recordsProcessed} employees`);
}
```

### Manual Integration Control

For more granular control:

```typescript
import { IntegrationFactory, IntegrationProvider, SyncType } from '@/lib/integrations';

const factory = IntegrationFactory.getInstance();

// Get Workday integration instance
const workday = await factory.getIntegration(
  'your-org-id',
  IntegrationProvider.WORKDAY
);

// Connect to Workday
await workday.connect();

// Perform sync
const result = await workday.sync({
  type: SyncType.FULL,
  entities: ['employees', 'positions'],
});

// Disconnect when done
await workday.disconnect();

console.log('Sync completed:', result);
```

### Health Check

Verify Workday connectivity:

```typescript
import { IntegrationFactory, IntegrationProvider } from '@/lib/integrations';

const factory = IntegrationFactory.getInstance();
const workday = await factory.getIntegration(
  'your-org-id',
  IntegrationProvider.WORKDAY
);

await workday.connect();
const health = await workday.healthCheck();

console.log(`Workday is ${health.healthy ? 'healthy' : 'unhealthy'}`);
if (!health.healthy) {
  console.error('Error:', health.error);
}
```

## Querying Synced Data

### Get All Employees

```typescript
import { db } from '@/db';
import { externalEmployees } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const employees = await db
  .select()
  .from(externalEmployees)
  .where(
    and(
      eq(externalEmployees.organizationId, 'your-org-id'),
      eq(externalEmployees.externalProvider, 'WORKDAY'),
      eq(externalEmployees.isActive, true)
    )
  );

console.log(`Found ${employees.length} active employees`);
```

### Get Employees by Department

```typescript
const salesEmployees = await db
  .select()
  .from(externalEmployees)
  .where(
    and(
      eq(externalEmployees.organizationId, 'your-org-id'),
      eq(externalEmployees.department, 'Sales')
    )
  );
```

### Get Recently Updated Employees

```typescript
const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

const recentUpdates = await db
  .select()
  .from(externalEmployees)
  .where(
    and(
      eq(externalEmployees.organizationId, 'your-org-id'),
      sql`${externalEmployees.lastSyncedAt} > ${recentDate}`
    )
  );
```

## Scheduled Syncs

Set up recurring syncs using the integration sync scheduler:

```typescript
import { db } from '@/db';
import { integrationSyncSchedules } from '@/db/schema';
import { IntegrationProvider, SyncType } from '@/lib/integrations';

await db.insert(integrationSyncSchedules).values({
  organizationId: 'your-org-id',
  provider: IntegrationProvider.WORKDAY,
  syncType: SyncType.INCREMENTAL,
  entities: ['employees'],
  schedule: '0 */6 * * *', // Every 6 hours
  enabled: true,
});
```

## API Endpoint Example

Create an API endpoint to trigger syncs:

```typescript
// app/api/integrations/workday/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeFullSync, IntegrationProvider } from '@/lib/integrations';
import { getCurrentOrganization } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentOrganization();
    if (!session?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entities } = await req.json();

    const result = await executeFullSync(
      session.organizationId,
      IntegrationProvider.WORKDAY,
      entities || ['employees', 'positions', 'departments']
    );

    return NextResponse.json({
      success: result.success,
      stats: {
        processed: result.recordsProcessed,
        created: result.recordsCreated,
        updated: result.recordsUpdated,
        failed: result.recordsFailed,
        duration: result.duration,
      },
    });
  } catch (error) {
    console.error('Workday sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
```

## Monitoring

### View Sync History

```typescript
import { db } from '@/db';
import { integrationSyncLog } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const history = await db
  .select()
  .from(integrationSyncLog)
  .where(
    and(
      eq(integrationSyncLog.organizationId, 'your-org-id'),
      eq(integrationSyncLog.provider, IntegrationProvider.WORKDAY)
    )
  )
  .orderBy(desc(integrationSyncLog.startedAt))
  .limit(10);

for (const log of history) {
  console.log(`${log.startedAt}: ${log.status} - ${log.recordsProcessed} records`);
}
```

### Check Last Sync Time

```typescript
const lastSync = await db.query.integrationConfigs.findFirst({
  where: and(
    eq(integrationConfigs.organizationId, 'your-org-id'),
    eq(integrationConfigs.provider, IntegrationProvider.WORKDAY)
  ),
});

if (lastSync?.lastSyncAt) {
  console.log('Last sync:', lastSync.lastSyncAt);
}
```

## Error Handling

The Workday adapter handles common errors:

- **AuthenticationError**: OAuth credentials invalid or expired
- **RateLimitError**: API rate limit exceeded (will retry after delay)
- **IntegrationError**: General API errors

```typescript
import { 
  AuthenticationError, 
  RateLimitError, 
  IntegrationError 
} from '@/lib/integrations';

try {
  await executeFullSync(orgId, IntegrationProvider.WORKDAY);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
    // Refresh credentials
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
    // Schedule retry
  } else if (error instanceof IntegrationError) {
    console.error('Integration error:', error.message);
  }
}
```

## Data Mapping

### Workday Fields → External Employees Table

| Workday Field | Database Column |
|--------------|----------------|
| `id` | `external_id` |
| `employeeID` | `employee_id` |
| `firstName` | `first_name` |
| `lastName` | `last_name` |
| `primaryWorkEmail.email` | `email` |
| `primaryWorkPhone` | `phone` |
| `businessTitle` | `position` |
| `location.descriptor` | `department`, `location` |
| `hireDate` | `hire_date` |
| `workerStatus.descriptor` | `employment_status` |
| `timeType.descriptor` | `work_schedule` |
| `manager.id` | `supervisor_id` |
| `manager.descriptor` | `supervisor_name` |

## Best Practices

1. **Schedule Incremental Syncs**: Run incremental syncs every 6 hours to minimize API usage
2. **Full Sync Weekly**: Perform full syncs weekly to catch any missed updates
3. **Monitor Failures**: Set up alerts for failed syncs
4. **Rate Limiting**: Workday typically allows 60 requests/minute
5. **Data Retention**: Keep `raw_data` for debugging but consider archiving after 90 days
6. **Testing**: Use Workday sandbox environment for development

## Next Steps

- Implement BambooHR adapter for SMB alternative
- Create admin UI for integration setup
- Add webhook support when Workday enables it
- Build employee-to-member mapping UI
- Add bulk operations for employee management
