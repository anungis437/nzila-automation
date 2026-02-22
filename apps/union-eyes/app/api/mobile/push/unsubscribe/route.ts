/**
 * GET POST /api/mobile/push/unsubscribe
 * -> Django auth_core: /api/auth_core/push/
 * NOTE: auto-resolved from mobile/push/unsubscribe
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/push/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/push/', { method: 'POST' });
}

