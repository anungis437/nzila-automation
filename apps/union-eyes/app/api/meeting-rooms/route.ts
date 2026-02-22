/**
 * GET POST /api/meeting-rooms
 * -> Django unions: /api/unions/meeting-rooms/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/meeting-rooms/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/meeting-rooms/', { method: 'POST' });
}

