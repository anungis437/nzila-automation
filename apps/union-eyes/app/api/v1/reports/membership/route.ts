/**
 * GET POST /api/v1/reports/membership
 * -> Django grievances: /api/grievances/claims/
 * NOTE: auto-resolved from v1/reports/membership
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/grievances/claims/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/grievances/claims/', { method: 'POST' });
}

