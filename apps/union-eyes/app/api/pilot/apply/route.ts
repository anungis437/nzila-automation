/**
 * GET POST /api/pilot/apply
 * -> Django auth_core: /api/auth_core/apply/
 * NOTE: auto-resolved from pilot/apply
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/apply/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/apply/', { method: 'POST' });
}

