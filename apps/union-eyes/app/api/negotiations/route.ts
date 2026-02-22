/**
 * GET POST /api/negotiations
 * -> Django bargaining: /api/bargaining/negotiations/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/negotiations/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/negotiations/', { method: 'POST' });
}

