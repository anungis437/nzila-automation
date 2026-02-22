/**
 * GET POST /api/units
 * -> Django unions: /api/unions/bargaining-units/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/bargaining-units/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/bargaining-units/', { method: 'POST' });
}

