/**
 * GET POST /api/billing/invoices
 * -> Django core: /api/core/external-invoices/
 * Auto-migrated by scripts/migrate_routes.py
 */
import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/core/external-invoices/');
}

export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/core/external-invoices/', { method: 'POST' });
}

