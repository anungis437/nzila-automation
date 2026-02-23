/**
 * GET POST /api/admin/seed-test-data
 * Migrated to withApi() framework
 */
import { withRoleAuth } from '@/lib/role-middleware';
import { seedOrganizationHierarchy } from '@/db/seeds/seed-org-hierarchy';
import { seedChildOrganizations } from '@/db/seeds/seed-child-orgs';
import { logger } from '@/lib/logger';

import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'admin' as const },
    openapi: {
      tags: ['Admin'],
      summary: 'GET seed-test-data',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        const hierarchy = await seedOrganizationHierarchy();
        const children = await seedChildOrganizations();
        logger.info('Full org seed completed (GET)', { userId, hierarchy, children });
        return { message: `Seeded: CLC + ${hierarchy.federationsCreated} federations + ${hierarchy.affiliatesCreated} affiliates + ${children.localsCreated} locals + ${children.districtsCreated} districts. Skipped: ${hierarchy.skipped.length + children.skipped.length}.`,
          data: { hierarchy, children }, };
  },
);

export const POST = withApi(
  {
    auth: { required: true, minRole: 'admin' as const },
    openapi: {
      tags: ['Admin'],
      summary: 'POST seed-test-data',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        const hierarchy = await seedOrganizationHierarchy();
        const children = await seedChildOrganizations();
        logger.info('Full org seed completed (POST)', { userId, hierarchy, children });
        return { message: `Seeded: CLC + ${hierarchy.federationsCreated} federations + ${hierarchy.affiliatesCreated} affiliates + ${children.localsCreated} locals + ${children.districtsCreated} districts. Skipped: ${hierarchy.skipped.length + children.skipped.length}.`,
          data: { hierarchy, children }, };
  },
);
