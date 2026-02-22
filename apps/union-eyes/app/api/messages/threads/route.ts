/**
 * GET POST /api/messages/threads
 * -> Django notifications: /api/notifications/messages/
 * NOTE: auto-resolved from messages/threads
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/notifications/messages/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/notifications/messages/', { method: 'POST' });
}

