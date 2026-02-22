/**
 * GET /api/analytics/claims/trends
 * -> Django analytics: /api/analytics/trend-analyses/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/analytics/trend-analyses/');
}

