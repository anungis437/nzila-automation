/**
 * GET POST /api/clc/sync
 * -> Django billing: /api/billing/clc-sync-log/
 * NOTE: auto-resolved from clc/sync
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/billing/clc-sync-log/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/billing/clc-sync-log/', { method: 'POST' });
}

