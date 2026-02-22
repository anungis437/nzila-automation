/**
 * GET POST /api/messaging/preferences
 * -> Django notifications: /api/notifications/message-threads/
 * NOTE: auto-resolved from messaging/preferences
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/notifications/message-threads/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/notifications/message-threads/', { method: 'POST' });
}

