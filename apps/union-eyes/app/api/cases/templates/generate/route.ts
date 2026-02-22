/**
 * GET POST /api/cases/templates/generate
 * -> Django grievances: /api/grievances/grievances/
 * NOTE: auto-resolved from cases/templates/generate
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/grievances/grievances/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/grievances/grievances/', { method: 'POST' });
}

