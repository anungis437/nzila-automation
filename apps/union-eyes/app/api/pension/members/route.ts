/**
 * GET POST /api/pension/members
 * -> Django billing: /api/billing/per-capita-remittances/
 * NOTE: auto-resolved from pension/members
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/billing/per-capita-remittances/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/billing/per-capita-remittances/', { method: 'POST' });
}

