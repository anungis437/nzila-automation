/**
 * GET POST /api/committees
 * -> Django unions: /api/unions/committees/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/committees/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/committees/', { method: 'POST' });
}

