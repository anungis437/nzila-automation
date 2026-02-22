// @ts-nocheck
/**
 * GraphQL API Endpoint
 * 
 * POST /api/graphql - GraphQL endpoint with GraphiQL playground
 * 
 * Features:
 * - GraphQL queries, mutations, subscriptions
 * - Interactive GraphiQL IDE in development
 * - Type-safe schema with TypeScript
 * - Integrates with existing database
 */

import { createYoga } from 'graphql-yoga';
import { schema } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';
import { withApiAuth } from '@/lib/api-auth-guard';
import {
  ErrorCode,
} from '@/lib/api/standardized-responses';

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  // Enable GraphiQL playground in development
  graphiql: process.env.NODE_ENV !== 'production',
  fetchAPI: {
    Request: Request,
    Response: Response,
  },
});

export const GET = withApiAuth(async (request, context) => yoga.fetch(request, context));
export const POST = withApiAuth(async (request, context) => yoga.fetch(request, context));

