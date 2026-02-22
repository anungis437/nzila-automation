/**
 * GET POST /api/mobile/sync
 * -> Django auth_core: /api/auth_core/sync/
 * NOTE: auto-resolved from mobile/sync
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/sync/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/sync/', { method: 'POST' });
}

