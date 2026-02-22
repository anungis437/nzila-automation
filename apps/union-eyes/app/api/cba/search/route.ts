/**
 * GET POST /api/cba/search
 * -> Django bargaining: /api/bargaining/collective-agreements/
 * NOTE: auto-resolved from cba/search
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/collective-agreements/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/bargaining/collective-agreements/', { method: 'POST' });
}

