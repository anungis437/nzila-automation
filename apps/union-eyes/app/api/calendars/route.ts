/**
 * GET POST /api/calendars
 * -> Django unions: /api/unions/calendars/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/calendars/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/calendars/', { method: 'POST' });
}

