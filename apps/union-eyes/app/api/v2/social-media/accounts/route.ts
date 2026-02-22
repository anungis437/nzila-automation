// @ts-nocheck
/**
 * GET POST PUT DELETE /api/social-media/accounts
 * Migrated to withApi() framework
 */
import { createMetaClient } from '@/lib/social-media/meta-api-client';
import { createTwitterClient, generatePKCE } from '@/lib/social-media/twitter-api-client';
import { createLinkedInClient } from '@/lib/social-media/linkedin-api-client';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { withApi, ApiError, z, RATE_LIMITS } from '@/lib/api/framework';

const socialMediaAccountsSchema = z.object({
  platform: z.string().min(1, 'platform is required'),
  account_id: z.string().uuid('Invalid account_id'),
});

import { GET as v1GET, POST as v1POST, PUT as v1PUT, DELETE as v1DELETE } from '@/app/api/social-media/accounts/route';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'steward' as const },
    openapi: {
      tags: ['Social-media'],
      summary: 'GET accounts',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1GET(request, { params: Promise.resolve(params) });
    return response;
  },
);

export const POST = withApi(
  {
    auth: { required: true, minRole: 'steward' as const },
    rateLimit: RATE_LIMITS.SOCIAL_MEDIA_API,
    openapi: {
      tags: ['Social-media'],
      summary: 'POST accounts',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1POST(request, { params: Promise.resolve(params) });
    return response;
  },
);

export const PUT = withApi(
  {
    auth: { required: true, minRole: 'steward' as const },
    rateLimit: RATE_LIMITS.SOCIAL_MEDIA_API,
    openapi: {
      tags: ['Social-media'],
      summary: 'PUT accounts',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1PUT(request, { params: Promise.resolve(params) });
    return response;
  },
);

export const DELETE = withApi(
  {
    auth: { required: true, minRole: 'steward' as const },
    rateLimit: RATE_LIMITS.SOCIAL_MEDIA_API,
    openapi: {
      tags: ['Social-media'],
      summary: 'DELETE accounts',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1DELETE(request, { params: Promise.resolve(params) });
    return response;
  },
);
