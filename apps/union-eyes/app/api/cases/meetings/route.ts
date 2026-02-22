/**
 * GET POST /api/cases/meetings
 * -> Django grievances: /api/grievances/grievances/
 * NOTE: auto-resolved from cases/meetings
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

