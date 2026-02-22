/**
 * GET POST /api/calendar-sync/microsoft/callback
 * -> Django unions: /api/unions/external-calendar-connections/
 * NOTE: auto-resolved from calendar-sync/microsoft/callback
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/external-calendar-connections/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/external-calendar-connections/', { method: 'POST' });
}

