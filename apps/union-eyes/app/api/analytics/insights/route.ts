/**
 * GET /api/analytics/insights
 * -> Django analytics: /api/analytics/insight-recommendations/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/analytics/insight-recommendations/');
}

