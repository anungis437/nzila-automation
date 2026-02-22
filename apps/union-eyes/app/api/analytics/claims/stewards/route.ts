/**
 * GET /api/analytics/claims/stewards
 * -> Django analytics: /api/analytics/analytics-metrics/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/analytics/analytics-metrics/');
}

