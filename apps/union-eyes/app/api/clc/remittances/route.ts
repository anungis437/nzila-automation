/**
 * GET POST /api/clc/remittances
 * -> Django billing: /api/billing/clc-sync-log/
 * NOTE: auto-resolved from clc/remittances
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

