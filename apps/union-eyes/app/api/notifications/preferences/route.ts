/**
 * GET POST /api/notifications/preferences
 * -> Django notifications: /api/notifications/in-app-notifications/
 * NOTE: auto-resolved from notifications/preferences
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/notifications/in-app-notifications/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/notifications/in-app-notifications/', { method: 'POST' });
}

