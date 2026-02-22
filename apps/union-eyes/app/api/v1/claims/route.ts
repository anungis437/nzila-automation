/**
 * GET POST /api/v1/claims
 * -> Django grievances: /api/grievances/claims/
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

