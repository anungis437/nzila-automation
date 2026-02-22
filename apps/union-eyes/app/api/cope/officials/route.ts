/**
 * GET POST /api/cope/officials
 * -> Django billing: /api/billing/donation-campaigns/
 * NOTE: auto-resolved from cope/officials
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/billing/donation-campaigns/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/billing/donation-campaigns/', { method: 'POST' });
}

