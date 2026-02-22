/**
 * GET POST /api/federations
 * -> Django unions: /api/unions/federations/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/federations/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/federations/', { method: 'POST' });
}

