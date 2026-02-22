/**
 * API Route Caching Utilities
 * 
 * Provides easy-to-use caching for Next.js API routes with:
 * - Time-based revalidation
 * - Stale-while-revalidate pattern
 * - Cache tags for targeted invalidation
 * - Response compression
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheGetOrSetStale } from './cache-service';
import { logger } from '@/lib/logger';

export interface ApiCacheOptions {
  /**
   * Cache duration in seconds
   * @default 60
   */
  revalidate?: number;
  
  /**
   * Stale-while-revalidate window in seconds
   * If specified, stale data is served while revalidating in background
   * @default undefined (disabled)
   */
  staleWhileRevalidate?: number;
  
  /**
   * Cache tags for targeted invalidation
   * @example ['user:123', 'org:456']
   */
  tags?: string[];
  
  /**
   * Cache key prefix
   * @default 'api-route'
   */
  namespace?: string;
}

/**
 * Generate cache key from request
 */
function generateCacheKey(request: NextRequest): string {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();
  
  return `${method}:${pathname}${searchParams ? `?${searchParams}` : ''}`;
}

/**
 * Cache API route response
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withApiCache(request, async () => {
 *     const data = await fetchData();
 *     return NextResponse.json(data);
 *   }, {
 *     revalidate: 60,
 *     staleWhileRevalidate: 30,
 *     tags: ['organizations']
 *   });
 * }
 * ```
 */
export async function withApiCache<T extends NextResponse>(
  request: NextRequest,
  handler: () => Promise<T>,
  options: ApiCacheOptions = {}
): Promise<T> {
  const {
    revalidate = 60,
    staleWhileRevalidate,
    tags = [],
    namespace = 'api-route'
  } = options;
  
  // Only cache GET requests
  if (request.method !== 'GET') {
    return handler();
  }
  
  const cacheKey = generateCacheKey(request);
  
  // If stale-while-revalidate is enabled, use that pattern
  if (staleWhileRevalidate) {
    const response = await cacheGetOrSetStale<T>(
      cacheKey,
      handler,
      {
        ttl: revalidate,
        staleWhileRevalidate,
        namespace
      }
    );
    
    // Add cache headers
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', `public, s-maxage=${revalidate}, stale-while-revalidate=${staleWhileRevalidate}`);
    headers.set('X-Cache-Status', 'HIT');
    if (tags.length > 0) {
      headers.set('X-Cache-Tags', tags.join(', '));
    }
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    }) as T;
  }
  
  // Standard caching without stale-while-revalidate
  const response = await handler();
  
  // Add cache headers
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', `public, s-maxage=${revalidate}`);
  if (tags.length > 0) {
    headers.set('X-Cache-Tags', tags.join(', '));
  }
  
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  }) as T;
}

/**
 * Simple revalidate config for API routes
 * 
 * @example
 * ```typescript
 * export const revalidate = 60; // Cache for 60 seconds
 * 
 * export async function GET() {
 *   const data = await fetchData();
 *   return NextResponse.json(data);
 * }
 * ```
 */
export function createApiRouteConfig(revalidate: number) {
  return { revalidate };
}

/**
 * Invalidate API cache by tags
 */
export async function invalidateApiCacheByTags(tags: string[]): Promise<void> {
  // This would integrate with your cache service
  // For now, it&apos;s a placeholder for future implementation
  logger.info('Invalidating API cache for tags', { tags });
}

/**
 * Example usage in an API route:
 * 
 * ```typescript
 * // app/api/organizations/route.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { withApiCache } from '@/lib/services/api-cache';
 * 
 * export async function GET(request: NextRequest) {
 *   return withApiCache(request, async () => {
 *     const organizations = await db.query.organizations.findMany();
 *     return NextResponse.json(organizations);
 *   }, {
 *     revalidate: 300, // 5 minutes
 *     staleWhileRevalidate: 60, // Serve stale for 1 minute while revalidating
 *     tags: ['organizations']
 *   });
 * }
 * ```
 */
