// @ts-nocheck
/**
 * GET POST /api/graphql
 * Migrated to withApi() framework
 */
import { createYoga } from 'graphql-yoga';
import { schema } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Graphql'],
      summary: 'GET graphql',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {
    // TODO: migrate handler body
    throw ApiError.internal('Route not yet migrated');
  },
);

export const POST = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Graphql'],
      summary: 'POST graphql',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {
    // TODO: migrate handler body
    throw ApiError.internal('Route not yet migrated');
  },
);
