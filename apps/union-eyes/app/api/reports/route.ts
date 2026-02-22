/**
 * GET POST /api/reports
 * -> Django analytics: /api/analytics/reports/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/analytics/reports/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/analytics/reports/', { method: 'POST' });
}

