/**
 * GET /api/tax/cra/export
 * -> Django billing: /api/billing/per-capita-remittances/
 * NOTE: auto-resolved from tax/cra/export
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/billing/per-capita-remittances/');
}

