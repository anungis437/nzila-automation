/**
 * GET POST /api/external-data/lrb
 * -> Django core: /api/core/external-accounts/
 * NOTE: auto-resolved from external-data/lrb
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/core/external-accounts/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/core/external-accounts/', { method: 'POST' });
}

