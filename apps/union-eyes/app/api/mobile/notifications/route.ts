/**
 * GET POST /api/mobile/notifications
 * -> Django auth_core: /api/auth_core/notifications/
 * NOTE: auto-resolved from mobile/notifications
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/notifications/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/notifications/', { method: 'POST' });
}

