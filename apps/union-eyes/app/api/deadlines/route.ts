/**
 * GET POST /api/deadlines
 * -> Django grievances: /api/grievances/claim-deadlines/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/grievances/claim-deadlines/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/grievances/claim-deadlines/', { method: 'POST' });
}

