/**
 * GET POST /api/graphql
 * Migrated to withApi() framework
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createYoga } from 'graphql-yoga';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { schema } from '@/lib/graphql/schema';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  async () => {
    throw ApiError.notImplemented('GraphQL endpoint is not yet available. Use REST API endpoints instead.');
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
  async () => {
    throw ApiError.notImplemented('GraphQL endpoint is not yet available. Use REST API endpoints instead.');
  },
);
