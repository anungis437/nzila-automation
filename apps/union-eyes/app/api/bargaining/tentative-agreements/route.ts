/**
 * GET POST /api/bargaining/tentative-agreements
 * -> Django bargaining: /api/bargaining/tentative-agreements/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/tentative-agreements/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/tentative-agreements/', { method: 'POST' });
}

