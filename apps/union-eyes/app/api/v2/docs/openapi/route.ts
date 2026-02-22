// @ts-nocheck
/**
 * GET /api/docs/openapi
 * Migrated to withApi() framework
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { logger } from '@/lib/logger';

import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Docs'],
      summary: 'GET openapi',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {

        const openApiPath = path.join(process.cwd(), 'docs', 'api', 'openapi-complete.yaml');

        if (!fs.existsSync(openApiPath)) {
          throw ApiError.notFound('OpenAPI specification not found. Run: pnpm run openapi:generate:enhanced');
        }

        const yamlContent = fs.readFileSync(openApiPath, 'utf-8');
        const spec = yaml.load(yamlContent) as Record<string, unknown>;

        return NextResponse.json(spec, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          },
        });

  },
);
